import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { refresh } from '@/server/services/auth';
import { cookies } from 'next/headers';
import { NextResponse } from "next/server"

export const POST = withErrorHandling(async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  
  const data = await refresh(refreshToken!);

  cookieStore.set("refresh_token", data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set("access_token", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({
    success: true,
    data
  });
})
