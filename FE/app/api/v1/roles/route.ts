import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { role } from '@/server/features/role';
import { listRolesSchema } from '@/server/features/role/schemas/list-roles.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    search: req.nextUrl.searchParams.get("search") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    offset: req.nextUrl.searchParams.get("offset") ?? undefined,
  }
  const input = parseWithZod(listRolesSchema, searchParams)
  const data = await role.queries.all(input);

  return NextResponse.json({ success: true, data, meta: {} })
})