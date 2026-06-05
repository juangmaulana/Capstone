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

export function authorize(authUser: AuthUser | null, allowedRoles: string[]): boolean {
  if (!authUser) return false
  return allowedRoles.includes(authUser.role);
}