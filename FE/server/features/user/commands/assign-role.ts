import { ApiError } from '@/lib/api/api-error'
import { RoleRepo } from '../../role/repo'
import { UserRepo } from '../repo'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { mapDbError } from '@/lib/db/mappers'
import { AssignRoleRequest } from '../schemas/assign-role.schema'

export const assignRole = (deps: {
  userRepo: UserRepo,
  roleRepo: RoleRepo,
}) => {
  const { userRepo, roleRepo } = deps

  return async (input: AssignRoleRequest) => {
    const user = await userRepo.findById(input.userId)
    if (!user) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'User not found')
    }

    const role = await roleRepo.findById(input.roleId)
    if (!role) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Role not found')
    }

    try {
      return await userRepo.update(input.userId, {
        role_id: input.roleId
      })
    } catch (err) {
      throw mapDbError(err)
    }
  }
}