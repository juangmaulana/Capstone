import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod'
import { login } from '@/server/auth';
import { loginSchema } from '@/server/auth/schemas/login.schema'
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from "next/server"

export const POST = withErrorHandling(async (req: NextRequest) => {
  const input = parseWithZod(loginSchema, await req.json());

  // Fallback admin credentials — read from server-side env vars only,
  // never exposed to the client bundle.
  const fbEmail = process.env.FALLBACK_ADMIN_EMAIL;
  const fbPassword = process.env.FALLBACK_ADMIN_PASSWORD;

  if (
    fbEmail && fbPassword &&
    input.email.toLowerCase() === fbEmail.toLowerCase() &&
    input.password === fbPassword
  ) {
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 0,
          name: process.env.FALLBACK_ADMIN_NAME ?? "Admin",
          email: fbEmail,
          role: process.env.FALLBACK_ADMIN_ROLE ?? "Super Admin",
        },
      },
    });
  }

  const data = await login(input.email, input.password);

  const cookieStore = await cookies();

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
