import { mapDbError } from '@/lib/db/mappers'
import { INotificationRepo } from '../repo'

export const listNotifications = (deps: {
  notificationRepo: INotificationRepo,
}) => async (userId: number) => {
  try {
    return await deps.notificationRepo.findAll(userId)
  } catch (err) {
    throw mapDbError(err)
  }
}