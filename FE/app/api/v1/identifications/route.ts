import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { identification } from '@/server/features/identification';
import { IdentificationFilterSchema } from '@/server/features/identification/schemas/filter.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (
  req: NextRequest,
) => {
  const searchParams = {
    search: req.nextUrl.searchParams.get("search") ?? undefined,
    plantId: req.nextUrl.searchParams.get("plant_id") ?? undefined,
    isSuccess: req.nextUrl.searchParams.get("is_success") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    offset: req.nextUrl.searchParams.get("offset") ?? undefined,
  }
  const filter = parseWithZod(IdentificationFilterSchema, searchParams)
  const data = await identification.query.all(filter)

  return NextResponse.json({ success: true, data, meta: {} })
})