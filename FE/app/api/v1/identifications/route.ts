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
  const { data, total, limit, offset } = await identification.query.all(filter)

  const hasNext = offset + limit < total
  const hasPrev = offset > 0
  
  let next = null
  const nextUrl = new URL(req.url)
  if (hasNext) {
    nextUrl.searchParams.set('offset', String(offset + limit))
    next = nextUrl.toString()
  }

  let prev = null
  const prevUrl = new URL(req.url)
  if (hasPrev) {
    prevUrl.searchParams.set('offset', String(Math.max(offset - limit, 0)))
    prev = prevUrl.toString()
  }

  return NextResponse.json({ 
    success: true, 
    data, 
    meta: {
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1,
    },
    links: {
      prev,
      next,
    }
  })
})