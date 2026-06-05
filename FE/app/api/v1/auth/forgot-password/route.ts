import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { forgotPassword } from '@/server/services/auth';
import { forgotPasswordSchema } from '@/server/services/auth/schemas/forgot-password.schema';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const input = parseWithZod(forgotPasswordSchema, await req.json());
  const data = await forgotPassword(input.email);

  return NextResponse.json({
    success: true,
    data
  })
})