import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  if (!request.headers.get("access_token")) {
    // login page or default fallback public page
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // '/api/:path*',
    // '/admin/:path*',
  ],
}