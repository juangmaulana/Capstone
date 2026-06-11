import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { canValidateIdentification } from '@/lib/admin-roles';
import { authorize, getAuthUser } from '@/lib/auth';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { identification } from '@/server/features/identification';
import { UpdateBoundingBoxSchema } from '@/server/features/identification/schemas/update-bounding-box.schema';
import { logEvent } from '@/server/services/audit';
import { deleteImage } from '@/server/services/upload';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = parseWithZod(IdSchema, await params)
  const data = await identification.query.byId(id)

  return NextResponse.json({ success: true, data })
})

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authUser = await getAuthUser()
  if (!authUser) throw forbidden('Unauthenticated')
  if (!authorize(authUser, ['admin'])) throw forbidden('Only admin can update identification')

  const { id } = parseWithZod(IdSchema, await params)
  const input = parseWithZod(UpdateBoundingBoxSchema, await req.json())
  const data = await identification.commands.updateBoundingBox(id, input)

  await logEvent({
    actorId: authUser.userId.toString(),
    entityId: data.id.toString(),
    entityType: 'Image',
    action: 'UPDATE',
    message: `User #${authUser.userId} updated Image #${data.id} bounding box`
  })

  return NextResponse.json({ success: true, data })
})

export const DELETE = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authUser = await getAuthUser();
  if (!authUser) throw forbidden('Unauthenticated');
  if (!canValidateIdentification(authUser.role)) {
    throw forbidden('Only admin can delete identification');
  }

  const { id } = parseWithZod(IdSchema, await params)
  const existing = await identification.query.byId(id)
  if (existing.image?.path) {
    try {
      await deleteImage(existing.image.path)
    } catch (error) {
      console.warn('Failed to delete stored identification image:', error)
    }
  }

  const data = await identification.commands.delete(id)

  await logEvent({
    actorId: authUser.userId.toString(),
    entityId: data.id.toString(),
    entityType: 'Identification',
    action: 'DELETE',
    message: `User #${authUser.userId} deleted Identification #${data.id}`
  })

  return NextResponse.json({ success: true, data })
})
