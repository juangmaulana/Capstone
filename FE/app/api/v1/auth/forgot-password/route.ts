import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/server/db';
import { sendPasswordResetEmail } from '@/server/lib/email';

// In-memory store for reset tokens (in production, use Redis or database)
// Token format: { email, expiresAt }
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Email wajib diisi' } },
        { status: 400 }
      );
    }

    // Check if email exists in database
    const user = await db
      .selectFrom('users')
      .select(['id', 'name', 'email'])
      .where('email', '=', email.trim().toLowerCase())
      .executeTakeFirst();

    if (!user) {
      // Don't reveal whether email exists (security best practice)
      // But still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, link reset password telah dikirim.',
      });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store token
    resetTokens.set(token, { email: user.email, expiresAt });

    // Clean up expired tokens
    for (const [key, value] of resetTokens.entries()) {
      if (value.expiresAt < Date.now()) {
        resetTokens.delete(key);
      }
    }

    // Send email
    await sendPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, link reset password telah dikirim.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

// Export for use by reset-password endpoint
export { resetTokens };
