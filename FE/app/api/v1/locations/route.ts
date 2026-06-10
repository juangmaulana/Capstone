import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { listLocations } from '@/server/services/locations';
import { LocationFilterSchema } from '@/server/services/locations/schema/filter.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    species: req.nextUrl.searchParams.get("species") ?? undefined,
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  }
  const filter = parseWithZod(LocationFilterSchema, searchParams);
  const data = await listLocations(filter);

  return NextResponse.json({ 
    success: true, 
    data, 
  })
})