import { z } from '@/lib/openapi/zod'

export const updateUserSchema = z.object({
  roleId: z.number().min(1).optional().openapi({
    example: 1,
  }),
  name: z.string().min(1).optional().openapi({
    example: 'John Doe',
  }),
  email: z.email().optional().openapi({
    example: 'john@example.com',
  }),
  password: z.string().min(6).optional().openapi({
    example: 'secret123',
  }),
  confirmPassword: z.string().min(6).optional().openapi({
    example: 'secret123',
  }),
})

.refine(
  (data) => {
    if (data.password !== undefined || data.confirmPassword !== undefined) {
      return data.password === data.confirmPassword
    }
    return true
  },
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
)

.transform((data) => {
  const result: {
    roleId?: number
    name?: string
    email?: string
    password?: string
  } = {}

  if (data.roleId !== undefined) result.roleId = data.roleId
  if (data.name !== undefined) result.name = data.name
  if (data.email !== undefined) result.email = data.email
  if (data.password !== undefined) result.password = data.password

  return result
})

.refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
})

.openapi({
  title: 'UpdateUserRequest',
})

export type UpdateUserRequest = z.infer<typeof updateUserSchema>
