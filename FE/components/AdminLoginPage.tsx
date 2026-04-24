"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

/* Registered emails that can receive password reset */
const REGISTERED_EMAILS = ["admin", "andi@biowatch.id"];

export function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const success = await login(email, password);

    if (!success) {
      setError("Invalid email or password. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }

    setIsSubmitting(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSubmitting(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setForgotSubmitting(false);

    const isRegistered = REGISTERED_EMAILS.includes(forgotEmail.trim().toLowerCase());
    if (!isRegistered) {
      setForgotError("Email tidak terdaftar dalam sistem. Silakan gunakan email yang terdaftar.");
      return;
    }

    setForgotSuccess(true);
  };

  const openForgot = () => {
    setForgotEmail("");
    setForgotSuccess(false);
    setForgotError("");
    setShowForgot(true);
  };

  return (
    <div className="admin-login-wrapper">
      {/* Animated background */}
      <div className="admin-login-bg">
        <div className="admin-login-gradient-orb admin-login-orb-1" />
        <div className="admin-login-gradient-orb admin-login-orb-2" />
        <div className="admin-login-gradient-orb admin-login-orb-3" />
      </div>

      <div className={`admin-login-card ${shake ? "admin-login-shake" : ""}`}>
        {/* Logo + Header */}
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <div className="admin-login-logo-icon">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div className="admin-login-logo-ring" />
          </div>
          <h1 className="admin-login-title">BioWatch Admin</h1>
          <p className="admin-login-subtitle">
            Sign in to access the administration panel
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-login-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="admin-email" className="admin-login-label">
              Email Address
            </label>
            <div className="admin-login-input-wrapper">
              <Mail className="admin-login-input-icon" />
              <input
                id="admin-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
                className="admin-login-input"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password" className="admin-login-label">
              Password
            </label>
            <div className="admin-login-input-wrapper">
              <Lock className="admin-login-input-icon" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="admin-login-input admin-login-input-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="admin-login-eye-btn"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="admin-login-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Sign In to Admin Panel
              </>
            )}
          </button>

          <div className="admin-login-forgot-row">
            <button
              type="button"
              onClick={openForgot}
              className="admin-login-forgot-link"
            >
              Forgot password?
            </button>
          </div>

        </form>

        {/* Footer hint */}
        <div className="admin-login-footer">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Protected area — authorized personnel only</span>
        </div>
      </div>

      <style jsx>{`
        .admin-login-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - var(--navbar-height, 64px));
          padding: 2rem;
          overflow: hidden;
        }

        .admin-login-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .admin-login-gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
        }

        .admin-login-orb-1 {
          width: 500px;
          height: 500px;
          background: hsl(122 46% 33%);
          top: -150px;
          right: -100px;
          animation: admin-float-1 8s ease-in-out infinite;
        }
        .admin-login-orb-2 {
          width: 400px;
          height: 400px;
          background: hsl(212 79% 42%);
          bottom: -100px;
          left: -100px;
          animation: admin-float-2 10s ease-in-out infinite;
        }
        .admin-login-orb-3 {
          width: 300px;
          height: 300px;
          background: hsl(150 30% 17%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: admin-float-3 12s ease-in-out infinite;
        }

        @keyframes admin-float-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }
        @keyframes admin-float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
        }
        @keyframes admin-float-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }

        .admin-login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          background: hsl(var(--card) / 0.85);
          backdrop-filter: blur(24px) saturate(1.5);
          border: 1px solid hsl(var(--border));
          border-radius: 1.25rem;
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.05),
            0 20px 50px -12px rgba(0,0,0,0.15);
          animation: admin-card-enter 0.5s ease-out;
        }

        @keyframes admin-card-enter {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .admin-login-shake {
          animation: admin-shake 0.5s ease-in-out;
        }

        @keyframes admin-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }

        .admin-login-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .admin-login-logo {
          position: relative;
          margin-bottom: 1.25rem;
        }

        .admin-login-logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 1rem;
          background: linear-gradient(135deg, hsl(122 46% 33%), hsl(122 46% 45%));
          box-shadow: 0 4px 12px hsl(122 46% 33% / 0.35);
        }

        .admin-login-logo-ring {
          position: absolute;
          inset: -6px;
          border-radius: 1.2rem;
          border: 2px solid hsl(122 46% 33% / 0.2);
          animation: admin-ring-pulse 2.5s ease-in-out infinite;
        }

        @keyframes admin-ring-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        .admin-login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          letter-spacing: -0.02em;
        }

        .admin-login-subtitle {
          margin-top: 0.375rem;
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .admin-login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          border-radius: 0.75rem;
          background: hsl(0 66% 47% / 0.08);
          border: 1px solid hsl(0 66% 47% / 0.2);
          color: hsl(0 66% 47%);
          font-size: 0.8125rem;
          animation: admin-error-enter 0.3s ease-out;
        }

        @keyframes admin-error-enter {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .admin-login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .admin-login-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .admin-login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .admin-login-input-icon {
          position: absolute;
          left: 0.875rem;
          width: 1rem;
          height: 1rem;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }

        .admin-login-input {
          width: 100%;
          height: 2.75rem;
          padding: 0 0.875rem 0 2.75rem;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }

        .admin-login-input:focus {
          border-color: hsl(122 46% 33%);
          box-shadow: 0 0 0 3px hsl(122 46% 33% / 0.12);
        }

        .admin-login-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-login-input::placeholder {
          color: hsl(var(--muted-foreground) / 0.6);
        }

        .admin-login-input-password {
          padding-right: 2.75rem;
        }

        .admin-login-eye-btn {
          position: absolute;
          right: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 0.375rem;
          color: hsl(var(--muted-foreground));
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }

        .admin-login-eye-btn:hover {
          color: hsl(var(--foreground));
        }



        .admin-login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 2.75rem;
          margin-top: 0.5rem;
          border-radius: 0.75rem;
          border: none;
          background: linear-gradient(135deg, hsl(122 46% 33%), hsl(122 46% 40%));
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px hsl(122 46% 33% / 0.3);
        }

        .admin-login-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, hsl(122 46% 30%), hsl(122 46% 37%));
          box-shadow: 0 4px 16px hsl(122 46% 33% / 0.4);
          transform: translateY(-1px);
        }

        .admin-login-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .admin-login-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .admin-login-forgot-row {
          display: flex;
          justify-content: center;
          margin-top: 0.25rem;
        }

        .admin-login-forgot-link {
          background: none;
          border: none;
          font-size: 0.8125rem;
          color: hsl(122 46% 33%);
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }

        .admin-login-forgot-link:hover {
          color: hsl(122 46% 25%);
          text-decoration: underline;
        }

        .admin-login-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid hsl(var(--border));
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
        }

        .admin-forgot-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          animation: admin-fade-in 0.2s ease-out;
        }

        @keyframes admin-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .admin-forgot-card {
          width: 100%;
          max-width: 420px;
          margin: 1rem;
          padding: 2rem;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 1.25rem;
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.2);
          animation: admin-modal-enter 0.25s ease-out;
        }

        @keyframes admin-modal-enter {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .admin-forgot-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .admin-forgot-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin-bottom: 0.5rem;
        }

        .admin-forgot-desc {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
          line-height: 1.5;
        }

        .admin-forgot-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .admin-forgot-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          height: 2.75rem;
          border-radius: 0.75rem;
          border: none;
          background: linear-gradient(135deg, hsl(122 46% 33%), hsl(122 46% 40%));
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px hsl(122 46% 33% / 0.3);
        }

        .admin-forgot-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, hsl(122 46% 30%), hsl(122 46% 37%));
          box-shadow: 0 4px 16px hsl(122 46% 33% / 0.4);
          transform: translateY(-1px);
        }

        .admin-forgot-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .admin-forgot-back {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 2.5rem;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: transparent;
          color: hsl(var(--muted-foreground));
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-forgot-back:hover {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }

        .admin-forgot-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1rem;
        }

        .admin-forgot-success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(122 46% 33%), hsl(122 46% 45%));
          box-shadow: 0 4px 12px hsl(122 46% 33% / 0.35);
        }
      `}</style>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="admin-forgot-overlay">
          <div className="admin-forgot-card">
            {forgotSuccess ? (
              <div className="admin-forgot-success">
                <div className="admin-forgot-success-icon">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h2 className="admin-forgot-title">Cek Email Anda</h2>
                <p className="admin-forgot-desc">
                  Link reset password telah dikirim ke <strong>{forgotEmail}</strong>. Silakan cek inbox atau folder spam Anda.
                </p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="admin-forgot-submit"
                >
                  Kembali ke Login
                </button>
              </div>
            ) : (
              <>
                <div className="admin-forgot-header">
                  <h2 className="admin-forgot-title">Forgot Password</h2>
                  <p className="admin-forgot-desc">
                    Masukkan alamat email Anda dan kami akan mengirimkan link untuk mereset password.
                  </p>
                </div>
                {forgotError && (
                  <div className="admin-login-error">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                <form onSubmit={handleForgotSubmit} className="admin-forgot-form">
                  <div className="admin-login-field">
                    <label htmlFor="forgot-email" className="admin-login-label">
                      Email Address
                    </label>
                    <div className="admin-login-input-wrapper">
                      <Mail className="admin-login-input-icon" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        autoComplete="email"
                        className="admin-login-input"
                        disabled={forgotSubmitting}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotSubmitting || !forgotEmail}
                    className="admin-forgot-submit"
                  >
                    {forgotSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>Kirim Link Reset</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="admin-forgot-back"
                  >
                    Kembali ke Login
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
