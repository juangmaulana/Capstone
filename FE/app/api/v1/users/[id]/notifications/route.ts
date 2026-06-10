import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { getAuthUser } from '@/lib/auth';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { notification } from '@/server/features/notification';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: userId } = parseWithZod(IdSchema, await params)
  
  const authUser = await getAuthUser();
  if (!authUser) throw forbidden('Unauthorized');
  if (authUser.userId !== userId) throw forbidden('Unauthorized');

  const data = await notification.query.list(userId)

  return NextResponse.json({
    success: true,
    data,
  })
})