import { ApiError } from '@/lib/api/api-error'
import { UserRepo } from '../repo'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { RoleRepo } from '../../role/repo'
import bcrypt from 'bcryptjs'
import { mapDbError } from '@/lib/db/mappers'
import { CreateUserRequest } from '../schemas/create-user.schema'

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

    const passwordHash = await bcrypt.hash(input.password, 10)

    try {
      return await userRepo.create({
        role_id: input.roleId,
        name: input.name,
        email: input.email,
        password: passwordHash,
      })
    } catch (err) {
      throw mapDbError(err)
    }
  }
}