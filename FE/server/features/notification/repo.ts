import { DB } from '@/server/db/types';
import { Notification } from './model';
import { toModel } from './mappers/to-model';

export interface INotificationRepo {
  findAll(userId: number): Promise<Notification[]>
  markAsRead(userId: number, notifId: number): Promise<boolean>
}

export const createNotificationRepo = (db: DB): INotificationRepo => ({
  findAll: async (userId: number) => {
    return db.selectFrom('notifications')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('id', 'desc')
      .execute()
      .then(rows => rows.map(toModel))
  },

  markAsRead: async (userId, notifId) => {
    const result = await db.updateTable('notifications')
      .set({
        is_read: true,
      })
      .where('id', '=', notifId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) === 0) {
      return false;
    }

    return true;
  },
})