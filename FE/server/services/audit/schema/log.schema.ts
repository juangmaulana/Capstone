import { z } from '@/lib/openapi/zod'

export const LogEventSchema = z.object({
  actorId: z.string().openapi({
    example: '1'
  }),
  entityId: z.string().openapi({
    example: '2'
  }),
  entityType: z.string().openapi({
    example: 'User'
  }),
  action: z.string().openapi({
    example: 'CREATE'
  }),
  message: z.string().optional().openapi({
    example: 'User 1 created a new user with id: 2'
  }),
});

export type LogEventRequest = z.infer<typeof LogEventSchema>