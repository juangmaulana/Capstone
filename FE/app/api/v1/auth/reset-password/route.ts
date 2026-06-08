import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { resetPassword } from '@/server/services/auth';
import { resetPasswordSchema } from '@/server/services/auth/schemas/reset-password.schema';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const input = parseWithZod(resetPasswordSchema, await req.json());
  const data = await resetPassword(input.resetToken, input.newPassword);

  return NextResponse.json({
    success: true,
    data
  })
})
