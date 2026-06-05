import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { getLocationStats } from '@/server/services/locations';
import { NextResponse } from 'next/server';

export const GET = withErrorHandling(async () => {
  const data = await getLocationStats();

  return NextResponse.json({ 
    success: true, 
    data, 
  })
})