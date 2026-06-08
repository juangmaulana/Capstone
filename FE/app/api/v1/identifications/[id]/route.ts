import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { getAuthUser } from '@/lib/auth';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { identification } from '@/server/features/identification';
import { UpdateIdentificationValidationSchema } from '@/server/features/identification/schemas/update-validation.schema';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { NextRequest, NextResponse } from 'next/server';

const canValidateIdentification = (role: string) => {
  const normalized = role.trim().toLowerCase();
  return normalized === 'admin' || normalized === 'super admin' || normalized === 'ranger';
};

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
  const authUser = await getAuthUser();
  if (!authUser) throw forbidden('Unauthenticated');
  if (!canValidateIdentification(authUser.role)) {
    throw forbidden('Only admin or ranger can update identification');
  }

  const { id } = parseWithZod(IdSchema, await params)
  const input = parseWithZod(UpdateIdentificationValidationSchema, await req.json())
  const data = await identification.commands.updateValidation(id, {
    ...input,
    validatedBy: authUser.userId,
  })

  return NextResponse.json({ success: true, data })
})
