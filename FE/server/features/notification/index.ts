import { db } from '@/server/db';
import { createNotificationModule } from './module';
import { createNotificationRepo } from './repo';

export const notification = createNotificationModule({ notificationRepo: createNotificationRepo(db) })