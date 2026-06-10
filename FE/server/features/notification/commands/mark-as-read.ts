import { mapDbError } from '@/lib/db/mappers'
import { INotificationRepo } from '../repo'
import { ApiError } from '@/lib/api/api-error'

export const markNotificationAsRead = (deps: {
  notificationRepo: INotificationRepo,
}) => async (userId: number, notifId: number) => {
  try {
    const success = await deps.notificationRepo.markAsRead(userId, notifId)
    if (!success) throw new ApiError('BAD_REQUEST')
    return success
  } catch (err) {
    throw mapDbError(err)
  }
}