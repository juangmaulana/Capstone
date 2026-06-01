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
  password: z.string().min(6).openapi({
    example: 'secret123',
  }),
  confirmPassword: z.string().min(6).openapi({
    example: 'secret123',
  }),
})

.refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

.transform((data) => ({
  roleId: data.roleId,
  name: data.name,
  email: data.email,
  password: data.password,
}))

.openapi({
  title: 'CreateUserRequest',
})

export type CreateUserRequest = z.infer<typeof createUserSchema>
