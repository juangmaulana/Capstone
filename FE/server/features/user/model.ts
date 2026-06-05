export type User = {
  id: number
  roleId: number
  name: string
  email: string
  lastLoginAt?: Date | string | null
  updatedAt?: Date | string | null
}