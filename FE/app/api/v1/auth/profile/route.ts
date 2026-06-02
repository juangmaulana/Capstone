import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { getProfile } from '@/server/auth';
import { cookies } from 'next/headers';
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async () => {
  const token = (await cookies()).get("access_token")?.value;
  const data = await getProfile(token!);

  return NextResponse.json({
    success: true,
    data
  });
})
