import { ApiError } from '@/lib/api/api-error'
import { UserRepo } from '../repo'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { RoleRepo } from '../../role/repo'
import { mapDbError } from '@/lib/db/mappers'
import { CreateUserRequest } from '../schemas/create-user.schema'
import { hashPassword } from '@/server/services/auth'

export const createUser = (deps: {
  userRepo: UserRepo,
  roleRepo: RoleRepo,
}) => {
  const { userRepo, roleRepo } = deps

  return async (input: CreateUserRequest) => {
    const user = await userRepo.findByEmail(input.email)
    if (user) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'Email already exist')
    }

    const role = await roleRepo.findById(input.roleId)
    if (!role) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Role not found')
    }

    try {
      const passwordHash = await hashPassword(input.password);

      return await deps.userRepo.create({
        email: input.email,
        name: input.name,
        password_hash: passwordHash,
        role_id: input.roleId
      })
    } catch (err) {
      throw mapDbError(err)
    }
  }
}