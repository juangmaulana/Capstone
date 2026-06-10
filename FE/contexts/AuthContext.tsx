"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { canAccessAdminSystem } from "@/lib/admin-roles";

interface AuthUser {
  id?: number;
  name: string;
  email: string;
  role: string;
  country?: string;
}

export type LoginResult = "success" | "invalid" | "rate_limited";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  registerUser: (email: string, password: string, name: string, role: string) => void;
  updatePassword: (email: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  updateUser: (updates: Partial<AuthUser>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "biowatch_admin_auth";
const REGISTERED_USERS_KEY = "biowatch_registered_users";
const ADMIN_LOGIN_ALIAS = "admin";
const ADMIN_EMAIL = "admin@bio-inspector.id";

const getAuthStorage = () => localStorage;
const getLegacyAuthStorage = () => sessionStorage;

const normalizeLoginEmail = (email: string) => {
  const value = email.trim().toLowerCase();
  return value === ADMIN_LOGIN_ALIAS ? ADMIN_EMAIL : value;
};

const getRoleName = (role: unknown) => {
  if (typeof role === "string") return role;
  if (role && typeof role === "object") {
    const roleRecord = role as Record<string, unknown>;
    return String(roleRecord.name || roleRecord.roleName || roleRecord.role_name || "");
  }
  return "";
};

const normalizeRoleName = (role: string) => {
  const normalized = role.trim().toLowerCase();
  if (normalized === "super admin" || normalized === "admin") return "Admin";
  if (normalized === "researcher") return "Researcher";
  if (normalized === "ranger") return "Ranger";
  return role.trim();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeAuthUser = useCallback((authUser: Record<string, unknown>): AuthUser => {
    const roleName = getRoleName(authUser.role) || getRoleName(authUser.roleName) || getRoleName(authUser.role_name) || "Admin";

    return {
      id: typeof authUser.id === "number" ? authUser.id : Number(authUser.id || authUser.userId) || undefined,
      name: String(authUser.name || authUser.email || "Admin"),
      email: String(authUser.email || ""),
      role: normalizeRoleName(roleName),
    };
  }, []);

  const clearAuthSession = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    getAuthStorage().removeItem(AUTH_STORAGE_KEY);
    getLegacyAuthStorage().removeItem(AUTH_STORAGE_KEY);
  }, []);

  const applyAuthUser = useCallback((authUser: AuthUser) => {
    if (!canAccessAdminSystem(authUser.role)) {
      clearAuthSession();
      return;
    }

    setUser(authUser);
    setIsAuthenticated(true);
    getAuthStorage().setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    getLegacyAuthStorage().removeItem(AUTH_STORAGE_KEY);
  }, [clearAuthSession]);

  const fetchServerAuth = useCallback(async (): Promise<AuthUser | null> => {
    const authRes = await fetch("/api/v1/auth");
    if (!authRes.ok) return null;

    const authJson = await authRes.json();
    const authUser = authJson.data?.user || authJson.user || authJson.data;
    return authJson.success && authUser ? normalizeAuthUser(authUser) : null;
  }, [normalizeAuthUser]);

  const hydrateServerSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const authUser = await fetchServerAuth();
      if (authUser) return authUser;

      const refreshRes = await fetch("/api/v1/auth/refresh", { method: "POST" });
      if (!refreshRes.ok) return null;

      return await fetchServerAuth();
    } catch (error) {
      console.warn("Server session auth unavailable:", error);
      return null;
    }
  }, [fetchServerAuth]);

  interface LocalCredential {
    email: string;
    password: string;
    name: string;
    role: string;
  }

  const getAllLocalCredentials = (): LocalCredential[] => {
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;
    let localSession: AuthUser | null = null;

    try {
      const stored = getAuthStorage().getItem(AUTH_STORAGE_KEY) || getLegacyAuthStorage().getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = normalizeAuthUser(JSON.parse(stored));
        localSession = parsed;
        if (canAccessAdminSystem(parsed.role)) {
          setUser(parsed);
          setIsAuthenticated(true);
          getAuthStorage().setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
          getLegacyAuthStorage().removeItem(AUTH_STORAGE_KEY);
        } else {
          clearAuthSession();
          localSession = null;
        }
      }
    } catch {
      clearAuthSession();
    }

    hydrateServerSession().then((serverUser) => {
      if (!isMounted) return;
      if (serverUser && canAccessAdminSystem(serverUser.role)) {
        applyAuthUser(serverUser);
      } else if (!localSession) {
        clearAuthSession();
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [applyAuthUser, clearAuthSession, hydrateServerSession, normalizeAuthUser]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const loginEmail = normalizeLoginEmail(email);

    // Try DB auth first via API
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password }),
      });

      if (res.ok) {
        const json = await res.json();
        const authUser = json.data?.user || json.user || json.data;
        if (json.success && authUser) {
          const userData = normalizeAuthUser(authUser);
          if (!canAccessAdminSystem(userData.role)) return "invalid";
          applyAuthUser(userData);
          return "success";
        }
      } else if (res.status === 429) {
        // Backend throttled the login (5 req/min). Surface this distinctly so
        // the UI doesn't mislead the user into thinking the password is wrong.
        return "rate_limited";
      }
    } catch (err) {
      console.warn("DB auth unavailable, falling back to local auth:", err);
    }

    // Fallback: local credential check
    await new Promise((resolve) => setTimeout(resolve, 300));

    const allCredentials = getAllLocalCredentials();
    const found = allCredentials.find(
      (cred) => cred.email.toLowerCase() === loginEmail && cred.password === password
    );

    if (found) {
      const userData = { name: found.name, email: found.email, role: found.role };
      if (!canAccessAdminSystem(userData.role)) return "invalid";
      applyAuthUser(userData);
      return "success";
    }

    return "invalid";
  };

  const registerUser = (email: string, password: string, name: string, role: string) => {
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      const registered = stored ? JSON.parse(stored) : [];
      registered.push({ email, password, name, role });
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
    } catch {
      // Silently fail for mock
    }
  };

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      getAuthStorage().setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updatePassword = async (email: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    // The latest auth API exposes forgot-password/verify-reset-code/reset-password
    // instead of an in-session change-password route. Keep this helper scoped to
    // local fallback users so it no longer calls a removed endpoint.
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      const registered: Array<{ email: string; password: string; name: string; role: string }> = stored ? JSON.parse(stored) : [];
      const userIdx = registered.findIndex(
        (cred) => cred.email === email && cred.password === currentPassword
      );
      if (userIdx !== -1) {
        registered[userIdx].password = newPassword;
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.warn("Server logout unavailable, clearing local session:", error);
    } finally {
      clearAuthSession();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, registerUser, updatePassword, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
