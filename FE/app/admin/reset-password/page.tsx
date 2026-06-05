"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const RESET_COPY = {
  en: {
    minPassword: "Password must be at least 8 characters",
    mismatch: "Passwords do not match",
    resetFailed: "Failed to reset password",
    genericError: "Something went wrong. Please try again.",
    validating: "Validating link...",
    wait: "Please wait a moment",
    invalidTitle: "Invalid Link",
    invalidDesc: "The password reset link is invalid or has expired. Please request a new one from the login page.",
    backLogin: "Back to Login",
    successTitle: "Password Reset Successfully!",
    successDesc: "Your password has been updated. Please log in with your new password.",
    loginNow: "Login Now",
    title: "Reset Password",
    desc: "Enter a new password for your account.",
    newPassword: "New Password",
    minPlaceholder: "At least 8 characters",
    confirmPassword: "Confirm Password",
    confirmPlaceholder: "Repeat new password",
    processing: "Processing...",
    loading: "Loading...",
  },
  id: {
    minPassword: "Password minimal 8 karakter",
    mismatch: "Password tidak cocok",
    resetFailed: "Gagal mereset password",
    genericError: "Terjadi kesalahan. Coba lagi.",
    validating: "Memvalidasi link...",
    wait: "Mohon tunggu sebentar",
    invalidTitle: "Link Tidak Valid",
    invalidDesc: "Link reset password tidak valid atau sudah kedaluwarsa. Silakan request ulang dari halaman login.",
    backLogin: "Kembali ke Login",
    successTitle: "Password Berhasil Direset!",
    successDesc: "Password Anda telah diperbarui. Silakan login dengan password baru.",
    loginNow: "Login Sekarang",
    title: "Reset Password",
    desc: "Masukkan password baru untuk akun Anda.",
    newPassword: "Password Baru",
    minPlaceholder: "Minimal 8 karakter",
    confirmPassword: "Konfirmasi Password",
    confirmPlaceholder: "Ulangi password baru",
    processing: "Memproses...",
    loading: "Loading...",
  },
} as const;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const code = searchParams.get("code");
  const { language } = useLanguage();
  const copy = RESET_COPY[language];

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(token || "");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(() => token ? true : (email && code ? null : false));

  // Validate token on mount
  useEffect(() => {
    if (token || !email || !code) return;

    fetch("/api/v1/auth/verify-reset-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        const nextToken = data.data?.resetToken || data.data?.reset_token || data.data?.token;
        setResetToken(nextToken || "");
        setIsValidToken(ok && data.success && Boolean(nextToken));
      })
      .catch(() => setIsValidToken(false));
  }, [code, email, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(copy.minPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError(copy.mismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || copy.resetFailed);
      } else {
        setSuccess(true);
      }
    } catch {
      setError(copy.genericError);
    }
    setIsSubmitting(false);
  };

  // Loading state
  if (isValidToken === null) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            <Loader2 className="animate-spin" style={{ width: 40, height: 40, color: "#1a5632" }} />
          </div>
          <h2 style={styles.title}>{copy.validating}</h2>
          <p style={styles.desc}>{copy.wait}</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ ...styles.iconWrapper, background: "#fef2f2" }}>
            <AlertCircle style={{ width: 40, height: 40, color: "#dc2626" }} />
          </div>
          <h2 style={styles.title}>{copy.invalidTitle}</h2>
          <p style={styles.desc}>
            {copy.invalidDesc}
          </p>
          <button onClick={() => router.push("/admin")} style={styles.btn}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            {copy.backLogin}
          </button>
        </div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ ...styles.iconWrapper, background: "#f0fdf4" }}>
            <CheckCircle2 style={{ width: 40, height: 40, color: "#16a34a" }} />
          </div>
          <h2 style={styles.title}>{copy.successTitle}</h2>
          <p style={styles.desc}>
            {copy.successDesc}
          </p>
          <button onClick={() => router.push("/admin")} style={styles.btn}>
            {copy.loginNow}
          </button>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrapper}>
          <KeyRound style={{ width: 40, height: 40, color: "#1a5632" }} />
        </div>
        <h2 style={styles.title}>{copy.title}</h2>
        <p style={styles.desc}>{copy.desc}</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>{copy.newPassword}</label>
            <div style={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={copy.minPlaceholder}
                required
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>{copy.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={copy.confirmPlaceholder}
              required
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.error}>
              <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} style={{ ...styles.btn, opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                {copy.processing}
              </>
            ) : (
              copy.title
            )}
          </button>
        </form>

        <button onClick={() => router.push("/admin")} style={styles.backLink}>
          <ArrowLeft style={{ width: 14, height: 14 }} />
          {copy.backLogin}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const copy = RESET_COPY[language];

  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            <Loader2 className="animate-spin" style={{ width: 40, height: 40, color: "#1a5632" }} />
          </div>
          <h2 style={styles.title}>{copy.loading}</h2>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f4f7f6 0%, #e8f0ec 100%)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center" as const,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#f0faf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1a1a",
  },
  desc: {
    margin: "0 0 24px",
    fontSize: 14,
    color: "#666",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    textAlign: "left" as const,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
  },
  inputWrapper: {
    position: "relative" as const,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    border: "1px solid #ddd",
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#999",
    padding: 4,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 44,
    borderRadius: 8,
    background: "#1a5632",
    color: "#fff",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 8,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: 13,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "#1a5632",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 20,
  },
};
