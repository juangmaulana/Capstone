import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { getLocationDetails } from '@/server/services/locations';
import { LocationDetailSchema } from '@/server/services/locations/schema/detail.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    species: req.nextUrl.searchParams.get("species") ?? undefined,
    latitude: req.nextUrl.searchParams.get("latitude") ?? undefined,
    longitude: req.nextUrl.searchParams.get("longitude") ?? undefined,
  }
  const request = parseWithZod(LocationDetailSchema, searchParams);
  const data = await getLocationDetails({
    latitude: request.latitude,
    longitude: request.longitude
  });

  return NextResponse.json({
    success: true,
    data,
  })
})