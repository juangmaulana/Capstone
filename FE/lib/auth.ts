import { authenticate } from '@/server/services/auth'
import { cookies } from 'next/headers'

type AuthUser = {
  userId: number,
  email: string,
  role: string,
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const accessToken = (await cookies()).get('access_token')?.value
  return await authenticate(accessToken!)
}

const normalizeRoleForAuthorization = (role: string): string => {
  const normalized = role.trim().toLowerCase();
  return normalized === 'super admin' ? 'admin' : normalized;
}

export function authorize(authUser: AuthUser | null, allowedRoles: string[]): boolean {
  if (!authUser) return false
  const userRole = normalizeRoleForAuthorization(authUser.role);
  return allowedRoles.some((role) => normalizeRoleForAuthorization(role) === userRole);
}
