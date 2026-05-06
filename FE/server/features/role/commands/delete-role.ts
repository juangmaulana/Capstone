import { RoleRepo } from '../../role/repo'
import { mapDbError } from '@/lib/db/mappers'
import { ApiError } from '@/lib/api/api-error'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { UserRepo } from '../../user/repo'

export const deleteRole = (deps: { 
  roleRepo: RoleRepo, 
  userRepo: UserRepo,
}) => {
  const { roleRepo, userRepo } = deps

  return async (id: number) => {
    const role = await roleRepo.findById(id)
    if (!role) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Role not found')
    }

    const count = await userRepo.countByRoleId(id)
    if (count > 0) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'User exists with this role')
    }

    try {
      return await roleRepo.delete(id)
    } catch (err) {
      throw mapDbError(err)
    }
  }
}