"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface AuthUser {
  id?: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerUser: (email: string, password: string, name: string, role: string) => void;
  updatePassword: (email: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "biowatch_admin_auth";
const REGISTERED_USERS_KEY = "biowatch_registered_users";
const ADMIN_LOGIN_ALIAS = "admin";
const ADMIN_EMAIL = "admin@bio-inspector.id";

const getAuthStorage = () => sessionStorage;

const normalizeLoginEmail = (email: string) => {
  const value = email.trim().toLowerCase();
  return value === ADMIN_LOGIN_ALIAS ? ADMIN_EMAIL : value;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeAuthUser = useCallback((authUser: Record<string, unknown>): AuthUser => ({
    id: typeof authUser.id === "number" ? authUser.id : Number(authUser.id) || undefined,
    name: String(authUser.name || "Admin"),
    email: String(authUser.email || ""),
    role: String(authUser.role || authUser.roleName || authUser.role_name || "Admin"),
  }), []);

  const applyAuthUser = useCallback((authUser: AuthUser) => {
    setUser(authUser);
    setIsAuthenticated(true);
    getAuthStorage().setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const fetchServerProfile = useCallback(async (): Promise<AuthUser | null> => {
    const profileRes = await fetch("/api/v1/auth/profile");
    if (!profileRes.ok) return null;

    const profileJson = await profileRes.json();
    const authUser = profileJson.data?.user || profileJson.user || profileJson.data;
    return profileJson.success && authUser ? normalizeAuthUser(authUser) : null;
  }, [normalizeAuthUser]);

  const hydrateServerSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const profile = await fetchServerProfile();
      if (profile) return profile;

      const refreshRes = await fetch("/api/v1/auth/refresh", { method: "POST" });
      if (!refreshRes.ok) return null;

      return await fetchServerProfile();
    } catch (error) {
      console.warn("Server session profile unavailable:", error);
      return null;
    }
  }, [fetchServerProfile]);

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
      const stored = getAuthStorage().getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        localSession = parsed;
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      getAuthStorage().removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    hydrateServerSession().then((serverUser) => {
      if (!isMounted) return;
      if (serverUser) {
        applyAuthUser(serverUser);
      } else if (!localSession) {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [applyAuthUser, hydrateServerSession]);

  const login = async (email: string, password: string): Promise<boolean> => {
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
          applyAuthUser(userData);
          return true;
        }
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
      applyAuthUser(userData);
      return true;
    }

    return false;
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

  const updatePassword = async (email: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    // Try backend API first (for users authenticated via DB)
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return true;
        // API responded but rejected (e.g., wrong password)
        return false;
      }
      // API route exists but returned error (not 404/network)
      if (res.status !== 404 && res.status !== 405) {
        return false;
      }
    } catch {
      // Network error or API unavailable — fall through to local check
    }

    // Fallback: local credential check (for fallback/offline logins)
    try {
      // Check registered users in localStorage
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
      setUser(null);
      setIsAuthenticated(false);
      getAuthStorage().removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, registerUser, updatePassword, isLoading }}>
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
