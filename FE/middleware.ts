import { NextRequest, NextResponse } from 'next/server'
import { refresh } from './server/services/auth'
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from './lib/auth-token-ttl'

export async function middleware(req: NextRequest) {
  return NextResponse.redirect(new URL(req.url))

  const accessToken = req.cookies.get('access_token')?.value
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

   // 1. Validate access token via external service
  if (accessToken) {
    const res = await fetch(`${process.env.AUTH_URL}/validate`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (res.ok) {
      return NextResponse.next()
    }
  }

  // 2. Try refresh
  if (refreshToken) {
    const data = await refresh(refreshToken!, false)

    if (data) {
      const response = NextResponse.next()

      response.cookies.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });
      
      response.cookies.set("access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      return response
    }
  }

  return NextResponse.redirect(new URL('/admin/login', req.url))
}

export const config = {
  matcher: [],
}