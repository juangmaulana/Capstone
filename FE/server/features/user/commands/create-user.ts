import { ApiError } from '@/lib/api/api-error'
import { UserRepo } from '../repo'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { RoleRepo } from '../../role/repo'
import bcrypt from 'bcryptjs'
import { mapDbError } from '@/lib/db/mappers'
import { CreateUserRequest } from '../schemas/create-user.schema'
import { sendWelcomeEmail } from '@/server/services/email'

export const createUser = (deps: {
  userRepo: UserRepo,
  roleRepo: RoleRepo,
}) => {
  const { userRepo, roleRepo } = deps

  return async (input: CreateUserRequest) => {
    const existing = await userRepo.findByEmail(input.email)
    if (existing) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'Email already exist')
    }

    const role = await roleRepo.findById(input.roleId)
    if (!role) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Role not found')
    }

    const passwordHash = await bcrypt.hash(input.password, 10)

    let created
    try {
      created = await userRepo.create({
        role_id: input.roleId,
        name: input.name,
        email: input.email,
        password_hash: passwordHash,
      })
    } catch (err) {
      throw mapDbError(err)
    }

    sendWelcomeEmail({
      to: input.email,
      name: input.name,
      email: input.email,
      password: input.password,
      role: role.name,
    }).catch(err => console.error('[Email] Failed to send welcome email:', err))

    return created
  }
}
