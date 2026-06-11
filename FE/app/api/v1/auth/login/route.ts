import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { canAccessAdminSystem } from '@/lib/admin-roles';
import { getAuthUser } from '@/lib/auth';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from '@/lib/auth-token-ttl';
import { parseWithZod } from '@/lib/validation/parse-with-zod'
import { login } from '@/server/services/auth';
import { loginSchema } from '@/server/services/auth/schemas/login.schema'
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from "next/server"

export const POST = withErrorHandling(async (req: NextRequest) => {
  const authUser = await getAuthUser();
  if (authUser)
    throw forbidden('User already authenticated')

  const input = parseWithZod(loginSchema, await req.json());
  const data = await login(input.email, input.password);

  // Role gate BEFORE establishing a session. Credentials may be valid, but only
  // admin/ranger roles get a cookie here. Visitor keeps using the public upload
  // and identification flow without entering the admin shell.
  const roleName =
    typeof data.user?.role === 'string' ? data.user.role : data.user?.role?.name;
  if (!canAccessAdminSystem(roleName)) {
    throw forbidden('This account does not have access to the admin system');
  }

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
