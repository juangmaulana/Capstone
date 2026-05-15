import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM_ADDRESS = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@biowatch.id';
const APP_NAME = 'BioWatch';
const APP_URL = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : 'http://194.233.74.133:3000';
const ADMIN_LOGIN_URL = `${APP_URL}/admin`;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send welcome email with temporary credentials to a new user
 */
export async function sendWelcomeEmail(to: string, name: string, tempPassword: string): Promise<boolean> {
  const loginUrl = ADMIN_LOGIN_URL;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a5632,#2d8a56);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🌿 ${APP_NAME}</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Invasive Alien Species Monitoring</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;">Selamat Datang, ${name}!</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
        Akun Anda telah dibuat di sistem ${APP_NAME}. Silakan gunakan kredensial berikut untuk login:
      </p>

      <!-- Credentials Box -->
      <div style="background:#f8faf9;border:1px solid #e0e8e4;border-radius:8px;padding:20px;margin:0 0 24px;">
        <div style="margin:0 0 12px;">
          <span style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Email</span>
          <span style="display:block;font-size:15px;font-weight:600;color:#1a1a1a;margin-top:4px;">${to}</span>
        </div>
        <div>
          <span style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Password Sementara</span>
          <span style="display:block;font-size:15px;font-weight:600;color:#1a5632;font-family:monospace;margin-top:4px;letter-spacing:1px;">${tempPassword}</span>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${loginUrl}" style="display:inline-block;background:#1a5632;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
          Login ke ${APP_NAME}
        </a>
      </div>

      <!-- Warning -->
      <div style="background:#fff8e6;border:1px solid #ffe0a0;border-radius:8px;padding:12px 16px;">
        <p style="margin:0;color:#8a6d00;font-size:13px;line-height:1.5;">
          ⚠️ <strong>Penting:</strong> Segera ganti password Anda setelah login pertama melalui menu Profile.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8faf9;border-top:1px solid #e8e8e8;padding:20px 40px;text-align:center;">
      <p style="margin:0;color:#999;font-size:12px;">
        Email ini dikirim otomatis oleh sistem ${APP_NAME}. Jangan balas email ini.
      </p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `[${APP_NAME}] Akun Anda Telah Dibuat`,
    html,
  });
}

/**
 * Send password reset email with reset link
 */
export async function sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/admin/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a5632,#2d8a56);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🌿 ${APP_NAME}</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Reset Password</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;">Halo, ${name}!</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
        Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru:
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${resetUrl}" style="display:inline-block;background:#1a5632;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:14px;font-weight:600;">
          Reset Password
        </a>
      </div>

      <p style="margin:0 0 16px;color:#666;font-size:13px;line-height:1.6;">
        Atau copy link berikut ke browser Anda:
      </p>
      <div style="background:#f5f5f5;border-radius:6px;padding:12px;word-break:break-all;">
        <code style="font-size:12px;color:#1a5632;">${resetUrl}</code>
      </div>

      <!-- Warning -->
      <div style="margin:24px 0 0;background:#fff0f0;border:1px solid #ffd0d0;border-radius:8px;padding:12px 16px;">
        <p style="margin:0;color:#c00;font-size:13px;line-height:1.5;">
          ⏰ Link ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8faf9;border-top:1px solid #e8e8e8;padding:20px 40px;text-align:center;">
      <p style="margin:0;color:#999;font-size:12px;">
        Email ini dikirim otomatis oleh sistem ${APP_NAME}. Jangan balas email ini.
      </p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `[${APP_NAME}] Reset Password`,
    html,
  });
}
