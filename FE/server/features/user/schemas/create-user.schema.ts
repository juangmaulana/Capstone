import { z } from '@/lib/openapi/zod'

export const createUserSchema = z.object({
  roleId: z.number().min(1).openapi({
    example: 1,
  }),
  name: z.string().min(1).openapi({
    example: 'John Doe',
  }),
  email: z.email().openapi({
    example: 'john@example.com',
  }),
  password: z.string().min(8).openapi({
    example: 'secret123',
  }),
})
.openapi({
  title: 'CreateUserRequest',
})

export type CreateUserRequest = z.infer<typeof createUserSchema>
