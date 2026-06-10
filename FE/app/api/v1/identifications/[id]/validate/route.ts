import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { authorize, getAuthUser } from '@/lib/auth';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { identification } from '@/server/features/identification';
import { UpdateValidationSchema } from '@/server/features/identification/schemas/update-validation.schema';
import { logEvent } from '@/server/services/audit';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authUser = await getAuthUser();
  if (!authUser) throw forbidden('Unauthenticated');
  if (!authorize(authUser, ['admin'])) {
    throw forbidden('Only admin can validate');
  }

  const { id } = parseWithZod(IdSchema, await params)
  const input = parseWithZod(UpdateValidationSchema, await req.json())

  const data = await identification.commands.updateValidation(id, input)

  await logEvent({
    actorId: authUser.userId.toString(),
    entityId: data.id.toString(),
    entityType: 'Identification',
    action: 'UPDATE',
    message: `User #${authUser.userId} validated Identification #${data.id}`
  })

  return NextResponse.json({ success: true, data })
})