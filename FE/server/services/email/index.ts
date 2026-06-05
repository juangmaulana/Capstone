import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://194.233.74.133:3000/'
const FROM   = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@bio-inspector.site'

export async function sendWelcomeEmail(opts: {
  to: string
  name: string
  email: string
  password: string
  role: string
}) {
  const { to, name, email, password, role } = opts

  await transporter.sendMail({
    from: `"Bio-Inspector" <${FROM}>`,
    to,
    subject: 'Akun Bio-Inspector Anda Telah Dibuat',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#166534;margin-top:0">Selamat datang di Bio-Inspector</h2>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Akun Anda telah dibuat oleh admin. Berikut adalah kredensial login Anda:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:120px">Email</td>
            <td style="padding:8px 0;font-weight:600">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280">Password</td>
            <td style="padding:8px 0;font-family:monospace;font-size:16px;font-weight:600;letter-spacing:1px">${password}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280">Role</td>
            <td style="padding:8px 0">${role}</td>
          </tr>
        </table>
        <a href="${APP_URL}/login"
           style="display:inline-block;background:#166534;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Login Sekarang
        </a>
        <p style="margin-top:24px;color:#9ca3af;font-size:13px">
          Segera ganti password Anda setelah login pertama kali.<br>
          Jika Anda tidak merasa mendaftar, abaikan email ini.
        </p>
      </div>
    `,
  })
}
