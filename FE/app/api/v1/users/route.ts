import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { getLinks } from '@/lib/next-pagination';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { user } from '@/server/features/user';
import { createUserSchema } from '@/server/features/user/schemas/create-user.schema';
import { UserFilterSchema } from '@/server/features/user/schemas/filter.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    search: req.nextUrl.searchParams.get("search") ?? undefined,
    roleId: req.nextUrl.searchParams.get("roleId") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    page: req.nextUrl.searchParams.get("page") ?? undefined,
  }
  const filter = parseWithZod(UserFilterSchema, searchParams)
  const { data, total, limit, page } = await user.queries.all(filter);
    
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

export const POST = withErrorHandling(async (req: NextRequest) => {
  const input = parseWithZod(createUserSchema, await req.json())
  const data = await user.commands.create(input)

  return NextResponse.json({ success: true, data }, { status: 201 })
})
