"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (email: string, password: string, name: string, role: string) => void;
  updatePassword: (email: string, currentPassword: string, newPassword: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ─── Mock admin credentials ─── */
const ADMIN_CREDENTIALS = [
  { email: "admin", password: "admin123", name: "Admin", role: "Super Admin" },
];

const AUTH_STORAGE_KEY = "biowatch_admin_auth";
const REGISTERED_USERS_KEY = "biowatch_registered_users";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to get all credentials (hardcoded + dynamically registered)
  const getAllCredentials = () => {
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      const registered = stored ? JSON.parse(stored) : [];
      return [...ADMIN_CREDENTIALS, ...registered];
    } catch {
      return ADMIN_CREDENTIALS;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allCredentials = getAllCredentials();
    const found = allCredentials.find(
      (cred) => cred.email === email && cred.password === password
    );

    if (found) {
      const userData = { name: found.name, email: found.email, role: found.role };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
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

  const updatePassword = (email: string, currentPassword: string, newPassword: string): boolean => {
    try {
      // Check hardcoded admin credentials first
      const adminIdx = ADMIN_CREDENTIALS.findIndex(
        (cred) => cred.email === email && cred.password === currentPassword
      );
      if (adminIdx !== -1) {
        // Update the runtime admin credential
        ADMIN_CREDENTIALS[adminIdx].password = newPassword;
        return true;
      }

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

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
