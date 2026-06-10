import { INotificationRepo } from './repo';
import { listNotifications } from './queries/list';
import { markNotificationAsRead } from './commands/mark-as-read';

export const createNotificationModule = (deps: {
  notificationRepo: INotificationRepo
}) => {
  const { notificationRepo } = deps;

  return {
    query: {
      list: listNotifications({ notificationRepo })
    },
    command: {
      markAsRead: markNotificationAsRead({ notificationRepo })
    }
  }
}