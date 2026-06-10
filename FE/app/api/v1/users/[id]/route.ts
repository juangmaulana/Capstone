import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { user } from '@/server/features/user';
import { updateUserSchema } from '@/server/features/user/schemas/update-user.schema';
import { NextRequest, NextResponse } from 'next/server';
import { authorize, getAuthUser } from '@/lib/auth';
import { forbidden } from '@/lib/api/errors/http.error';
import { logEvent } from '@/server/services/audit';
import { changePassword } from '@/server/services/auth';
import { cookies } from 'next/headers';
import { canManageUsers } from '@/lib/admin-roles';

export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>},
) => {
  const authUser = await getAuthUser();
  if (!authUser) throw forbidden('Unauthenticated');

  const { id } = parseWithZod(IdSchema, await params)
  if (!canManageUsers(authUser.role) && authUser.userId !== id)
    throw forbidden('Can only view your own profile, unless admin');

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

  if (!authorize(authUser, ['Admin', 'admin']) && authUser.userId !== id)
    throw forbidden('Can only update your own, unless admin');
  if (!authorize(authUser, ['Admin', 'admin']) && input.roleId)
    throw forbidden('Only admin can update roles');

  const data = await user.commands.update(id, input)
  if (input.password) {
    const cookieStore = await cookies()

    const accessToken = cookieStore.get('access_token')?.value
    await changePassword(accessToken!, id, input.password)

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
  }

  await logEvent({
    actorId: authUser.userId.toString(),
    entityId: id.toString(),
    entityType: 'User',
    action: 'UPDATE',
  })

  return NextResponse.json({ success: true, data })
})

export const DELETE = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>},
) => {
  const authUser = await getAuthUser();
  if (!authUser)
    throw forbidden('Unauthenticated');
  if (!authorize(authUser, ['Admin', 'admin']))
    throw forbidden('User deletion can only be done by admin');

  const { id } = parseWithZod(IdSchema, await params)
  const data = await user.commands.delete(id)

  await logEvent({
    actorId: authUser.userId.toString(),
    entityId: id.toString(),
    entityType: 'User',
    action: 'DELETE',
  })

  return NextResponse.json({ success: true, data })
})
