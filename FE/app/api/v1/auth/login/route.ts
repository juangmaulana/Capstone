import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from '@/lib/auth-token-ttl';
import { parseWithZod } from '@/lib/validation/parse-with-zod'
import { login } from '@/server/services/auth';
import { loginSchema } from '@/server/services/auth/schemas/login.schema'
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from "next/server"

export const POST = withErrorHandling(async (req: NextRequest) => {
  const input = parseWithZod(loginSchema, await req.json());
  const data = await login(input.email, input.password);

  const cookieStore = await cookies();

  cookieStore.set("refresh_token", data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  cookieStore.set("access_token", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  return NextResponse.json({
    success: true,
    data
  });
})
