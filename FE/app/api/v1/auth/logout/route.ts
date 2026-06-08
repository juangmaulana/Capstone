import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { logout } from '@/server/services/auth';
import { cookies } from 'next/headers';
import { NextResponse } from "next/server"

export const POST = withErrorHandling(async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  let data = null;

  if (refreshToken) {
    try {
      data = await logout(refreshToken);
    } catch (error) {
      console.warn("Server logout failed, clearing auth cookies locally:", error);
    }
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");

  return NextResponse.json({
    success: true,
    data
  });
})
