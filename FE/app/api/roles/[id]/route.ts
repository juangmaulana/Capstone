import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { paramNumberIdSchema } from '@/lib/validation/param-number-id.schema';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { role } from '@/server/features/role';
import { updateRoleSchema } from '@/server/features/role/schemas/update-role.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = parseWithZod(paramNumberIdSchema, await params)
  const data = await role.queries.byId(id)

  return NextResponse.json({ success: true, data })
})

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = parseWithZod(paramNumberIdSchema, await params)
  const input = parseWithZod(updateRoleSchema, await req.json())
  const data = await role.commands.update(id, input)

  return NextResponse.json({ success: true, data })
})

export const DELETE = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = parseWithZod(paramNumberIdSchema, await params)
  const data = await role.commands.delete(id)

  return NextResponse.json({ success: true, data })
})
