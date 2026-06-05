import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { getLinks } from '@/lib/next-pagination';
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
    page: req.nextUrl.searchParams.get("page") ?? undefined,
  }
  const filter = parseWithZod(IdentificationFilterSchema, searchParams)
  const { data, total, limit, page } = await identification.query.all(filter)

  const { prev, next } = getLinks(total, limit, page, req.url);

  return NextResponse.json({ 
    success: true, 
    data, 
    meta: {
      total,
      limit,
      page,
    },
    links: {
      prev,
      next,
    }
  })
})