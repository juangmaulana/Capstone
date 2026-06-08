import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { nearbyImages } from '@/server/services/locations';
import { NearbyImagesSchema } from '@/server/services/locations/schema/nearby.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    latitude: req.nextUrl.searchParams.get("latitude") ?? undefined,
    longitude: req.nextUrl.searchParams.get("longitude") ?? undefined,
    radius: req.nextUrl.searchParams.get("radius") ?? undefined,
  }
  const request = parseWithZod(NearbyImagesSchema, searchParams);
  const data = await nearbyImages({
    latitude: request.latitude,
    longitude: request.longitude,
    radius: request.radius,
  });

  return NextResponse.json({
    success: true,
    data,
  })
})