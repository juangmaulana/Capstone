import { authenticate, refresh } from '@/server/services/auth'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from './auth-token-ttl'
import { cookies } from 'next/headers'

type AuthUser = {
  userId: number,
  email: string,
  role: string,
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  let accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    accessToken = await refreshSession(cookieStore);
  }
  if (!accessToken) return null;

  const user = await authenticate(accessToken);
  if (user) return user;

  // Token invalid → try refresh once
  accessToken = await refreshSession(cookieStore);
  if (!accessToken) return null;

  return await authenticate(accessToken);
}

export function authorize(authUser: AuthUser | null, allowedRoles: string[]): boolean {
  if (!authUser) return false;

  const userRole = normalizeRoleForAuthorization(authUser.role);
  return allowedRoles.some(
    (role) => normalizeRoleForAuthorization(role) === userRole
  );
}

async function refreshSession(cookieStore: ReadonlyRequestCookies): Promise<string | undefined> {
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (!refreshToken) return undefined;

  const result = await refresh(refreshToken);
  if (!result) return undefined;

  cookieStore.set("refresh_token", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  
  cookieStore.set("access_token", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  return result.accessToken;
}