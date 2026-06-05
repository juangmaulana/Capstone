import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { getAuthUser } from '@/lib/auth';
import { getProfile } from '@/server/services/auth';
import { cookies } from 'next/headers';
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async () => {
  const authUser = await getAuthUser();
  if (!authUser)
    throw forbidden('Unauthenticated');

  const token = (await cookies()).get('access_token')?.value
  const data = await getProfile(token!)

  return NextResponse.json({
    success: true,
    data
  });
})
