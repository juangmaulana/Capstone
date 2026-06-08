import nodemailer from "nodemailer";

type UserCredentialsEmailInput = {
  to: string;
  name: string;
  email: string;
  password: string;
  role?: string;
};

export type EmailDeliveryResult = {
  sent: boolean;
  reason?: string;
};

const APP_NAME = process.env.APP_NAME || "Bio-Inspector";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: process.env.SMTP_SECURE === "true",
    from,
    auth: { user, pass },
  };
};

export const sendUserCredentialsEmail = async (
  input: UserCredentialsEmailInput
): Promise<EmailDeliveryResult> => {
  const config = getSmtpConfig();

  if (!config) {
    return { sent: false, reason: "SMTP is not configured" };
  }

  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safePassword = escapeHtml(input.password);
  const safeRole = input.role ? escapeHtml(input.role) : "";

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${config.from}>`,
      to: input.to,
      subject: `[${APP_NAME}] Akun Anda Telah Dibuat`,
      text: [
        `Halo, ${input.name}!`,
        "",
        `Akun ${APP_NAME} Anda telah dibuat.`,
        "",
        `Email: ${input.email}`,
        input.role ? `Role: ${input.role}` : "",
        `Password sementara: ${input.password}`,
        "",
        "Demi keamanan, segera ganti password sementara ini setelah login pertama.",
      ].filter(Boolean).join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <p>Halo, ${safeName}!</p>
          <p>Akun ${APP_NAME} Anda telah dibuat. Gunakan kredensial berikut untuk login pertama kali:</p>
          <table style="border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 6px 12px; font-weight: 700;">Email</td>
              <td style="padding: 6px 12px;">${safeEmail}</td>
            </tr>
            ${
              safeRole
                ? `<tr><td style="padding: 6px 12px; font-weight: 700;">Role</td><td style="padding: 6px 12px;">${safeRole}</td></tr>`
                : ""
            }
            <tr>
              <td style="padding: 6px 12px; font-weight: 700;">Password sementara</td>
              <td style="padding: 6px 12px; font-family: monospace;">${safePassword}</td>
            </tr>
          </table>
          <p>Demi keamanan, segera ganti password sementara ini setelah login pertama.</p>
        </div>
      `,
    });

    return { sent: true };
  } catch (error) {
    console.error("Failed to send user credentials email:", error);
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Email delivery failed",
    };
  }
};
