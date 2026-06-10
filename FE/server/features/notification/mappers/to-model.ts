import { NotificationSelect } from '@/server/db/types'
import { Notification } from '../model'

export const toModel = (row: NotificationSelect): Notification => {
  return {
    id: row.id,
    userId: row.user_id,
    recipientRole: row.recipient_role,
    actorId: row.actor_id,
    actorUsername: row.actor_username,
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    message: row.message,
    metadata: row.metadata,
    isRead: row.is_read,
    createdAt: row.created_at
  }
}

export const toModelOrNull = (
  row: NotificationSelect | undefined
): Notification | null => {
  return row ? toModel(row) : null
}
