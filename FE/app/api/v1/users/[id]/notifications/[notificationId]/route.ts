import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { forbidden } from '@/lib/api/errors/http.error';
import { getAuthUser } from '@/lib/auth';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { notification } from '@/server/features/notification';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string, notificationId: string }> }
) => {
  const { id, notificationId } = await params
  const { id: userId } = parseWithZod(IdSchema, { id })
  const { id: notifId } = parseWithZod(IdSchema, { id: notificationId })

  const authUser = await getAuthUser();
  if (!authUser) throw forbidden('Unauthorized');
  if (authUser.userId !== userId) throw forbidden('Unauthorized');
  
  const data = await notification.command.markAsRead(userId, notifId)

  return NextResponse.json({
    success: true,
    data,
  })
})