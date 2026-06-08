"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminLoginPage } from "@/components/AdminLoginPage";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const canAccessAdminSystem = (role?: string) => {
  const normalized = role?.trim().toLowerCase();
  return normalized === "super admin" || normalized === "admin" || normalized === "researcher";
};

function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{language === "id" ? "Memuat..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  // Allow access to reset-password page without authentication
  if (pathname === "/admin/reset-password") {
    return <>{children}</>;
  }

  if (!isAuthenticated || !canAccessAdminSystem(user?.role)) {
    return <AdminLoginPage />;
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminGate>{children}</AdminGate>
    </AuthProvider>
  );
}
