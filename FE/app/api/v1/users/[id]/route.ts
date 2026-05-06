import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { user } from '@/server/features/user';
import { updateUserSchema } from '@/server/features/user/schemas/update-user.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }>},
) => {
  const { id } = parseWithZod(IdSchema, await params)
  const data = await user.queries.byId(id)

  return NextResponse.json({ success: true, data })
})

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>},
) => {
  const { id } = parseWithZod(IdSchema, await params)
  const input = parseWithZod(updateUserSchema, await req.json())
  const data = await user.commands.update(id, input)

  return NextResponse.json({ success: true, data })
})

export const DELETE = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }>},
) => {
  const { id } = parseWithZod(IdSchema, await params)
  const data = await user.commands.delete(id)

  return NextResponse.json({ success: true, data })
})