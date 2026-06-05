import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { verifyResetCode } from '@/server/auth';
import { verifyResetCodeSchema } from '@/server/auth/schemas/verify-reset-code.schema';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const input = parseWithZod(verifyResetCodeSchema, await req.json());
  const data = await verifyResetCode(input.email, input.code);

  return NextResponse.json({
    success: true,
    data
  })
})