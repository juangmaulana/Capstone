import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/server/db';
import { resetTokens } from '@/app/api/auth/forgot-password/route';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Token tidak valid' } },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: 'Password minimal 8 karakter' } },
        { status: 400 }
      );
    }

    // Validate token
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: { message: 'Token tidak valid atau sudah kedaluwarsa' } },
        { status: 400 }
      );
    }

    if (tokenData.expiresAt < Date.now()) {
      resetTokens.delete(token);
      return NextResponse.json(
        { success: false, error: { message: 'Token sudah kedaluwarsa. Silakan request reset password kembali.' } },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password in database
    await db
      .updateTable('users')
      .set({ password: hashedPassword })
      .where('email', '=', tokenData.email)
      .execute();

    // Invalidate the token
    resetTokens.delete(token);

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}

// GET endpoint to validate token (used by reset password page)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { success: false, valid: false, error: { message: 'Token tidak ditemukan' } },
      { status: 400 }
    );
  }

  const tokenData = resetTokens.get(token);
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    if (tokenData) resetTokens.delete(token);
    return NextResponse.json(
      { success: false, valid: false, error: { message: 'Token tidak valid atau sudah kedaluwarsa' } },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, valid: true });
}
