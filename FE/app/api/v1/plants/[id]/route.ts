import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { getAuthUser } from '@/lib/auth';
import { canDeletePlants, canUpdatePlants } from '@/lib/admin-roles';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { plant } from '@/server/features/plant';
import { UpdatePlantSchema, UpdatePlantWithFileSchema } from '@/server/features/plant/schemas/update.schema';
import { logEvent } from '@/server/services/audit';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { deleteImage, uploadImage } from '@/server/services/upload';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = parseWithZod(IdSchema, await params)
  const data = await plant.query.byId(id)

  return NextResponse.json({ success: true, data })
})

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authUser = await getAuthUser();
  if (!authUser)
    throw forbidden('Unauthenticated');
  if (!canUpdatePlants(authUser.role))
    throw forbidden('Only admins allowed for updating plants')

  const { id } = parseWithZod(IdSchema, await params)

  const formData = await req.formData()
  const bodyJson = Object.fromEntries(formData);
  const imageFile = formData.get('imageFile');
  const formInput = parseWithZod(UpdatePlantWithFileSchema, {
    ...bodyJson,
    imageFile
  })

  if (!formInput.imageFile) {
    const input = parseWithZod(UpdatePlantSchema, formInput)
    const data = await plant.command.update(id, input);
    return NextResponse.json({ success: true, data })
  }

  const { imagePath } = await plant.query.byId(id);
  await deleteImage(imagePath);

  const uploadResult = await uploadImage(formInput.imageFile as File);
  const input = parseWithZod(UpdatePlantSchema, {
    ...formInput,
    imagePath: uploadResult.path,
  })
  const data = await plant.command.update(id, input)

  await logEvent({
    actorId: authUser.userId.toString(),
    entityId: id.toString(),
    entityType: 'Plant',
    action: 'UPDATE',
    message: `User #${authUser.userId} updated Plant #${id}`
  })

  return NextResponse.json({ success: true, data })
})

export const DELETE = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authUser = await getAuthUser();
    if (!authUser)
      throw forbidden('Unauthenticated');
    if (!canDeletePlants(authUser.role))
      throw forbidden('Plant deletion only allowed for admins')

  const { id } = parseWithZod(IdSchema, await params)
  const data = await plant.command.delete(id)

  await logEvent({
    actorId: authUser.userId.toString(),
    entityId: id.toString(),
    entityType: 'Plant',
    action: 'DELETE',
    message: `User #${authUser.userId} deleted Plant #${id}`
  })

  return NextResponse.json({ success: true, data })
})
