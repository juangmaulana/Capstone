import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { getAuthUser } from '@/lib/auth';
import { NextResponse } from "next/server"

export const GET = withErrorHandling(async () => {
  const data = await getAuthUser();

  return NextResponse.json({
    success: true,
    data,
  });
})
