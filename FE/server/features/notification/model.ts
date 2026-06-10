export type Notification = {
  id: number
  userId: number
  recipientRole: string
  actorId: number
  actorUsername: string
  actorRole: string
  action: string
  entityType: string
  entityId: number
  message: string
  metadata: string
  isRead: boolean
  createdAt: Date
}