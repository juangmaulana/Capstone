import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { user } from '@/server/features/user';
import { updateUserSchema } from '@/server/features/user/schemas/update-user.schema';
import { NextRequest, NextResponse } from 'next/server';
import { authorize, getAuthUser } from '@/lib/auth';
import { forbidden } from '@/lib/api/errors/http.error';

export const GET = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }>},
) => {
  const authUser = await getAuthUser();
  if (!authUser) throw forbidden('Unauthenticated');

  const { id } = parseWithZod(IdSchema, await params)
  const data = await user.queries.byId(id)

  return NextResponse.json({ success: true, data })
})

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>},
) => {
  const authUser = await getAuthUser();
  if (!authUser) 
    throw forbidden('Unauthenticated');
  
  const { id } = parseWithZod(IdSchema, await params)
  const input = parseWithZod(updateUserSchema, await req.json())

  if (!authorize(authUser, ['admin']) && authUser.userId !== id) 
    throw forbidden('Can only update your own, unless admin');
  if (!authorize(authUser, ['admin']) && input.roleId) 
    throw forbidden('Only admin can update roles');

  // TODO: link with auth for password hashing
  const data = await user.commands.update(id, input)

  return NextResponse.json({ success: true, data })
})

export const DELETE = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }>},
) => {
  const authUser = await getAuthUser();
  if (!authUser)
    throw forbidden('Unauthenticated');
  if (!authorize(authUser, ['admin'])) 
    throw forbidden('User deletion can only be done by admin');

  const { id } = parseWithZod(IdSchema, await params)
  const data = await user.commands.delete(id)

  return NextResponse.json({ success: true, data })
})