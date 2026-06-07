import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { getAuthUser } from '@/lib/auth';
import { getLinks } from '@/lib/next-pagination';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { getAuditLogs } from '@/server/services/audit';
import { AuditFilterSchema } from '@/server/services/audit/schema/filter.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const authUser = await getAuthUser()
  if (!authUser)
    throw forbidden('Unauthorized')

  const searchParams = {
    entityType: req.nextUrl.searchParams.get("entityType") ?? undefined,
    action: req.nextUrl.searchParams.get("action") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    page: req.nextUrl.searchParams.get("page") ?? undefined,
  }
  const filter = parseWithZod(AuditFilterSchema, searchParams)
  const { data, total, limit, page } = await getAuditLogs(filter);
    
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