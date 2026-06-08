import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { getAuthUser } from '@/lib/auth';
import { getLinks } from '@/lib/next-pagination';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { role } from '@/server/features/role';
import { RoleFilterSchema } from '@/server/features/role/schemas/filter.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const authUser = await getAuthUser();
  if (!authUser)
    throw forbidden('Unauthenticated');

  const searchParams = {
    search: req.nextUrl.searchParams.get("search") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    page: req.nextUrl.searchParams.get("page") ?? undefined,
  }
  const filter = parseWithZod(RoleFilterSchema, searchParams)

  const { data, total, limit, page } = await role.queries.all(filter);

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