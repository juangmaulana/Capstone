import { RoleRepo } from '../../role/repo'
import { mapDbError } from '@/lib/db/mappers'
import { UpdateRoleRequest } from '../schemas/update-role.schema'
import { RoleUpdate } from '@/server/db/types'
import { ApiError } from '@/lib/api/api-error'
import { ErrorCode } from '@/lib/api/errors/error-codes'

export const updateRole = (deps: { 
  roleRepo: RoleRepo, 
}) => {
  const { roleRepo } = deps

  return async (id: number, input: UpdateRoleRequest) => {
    const role = await roleRepo.findById(id)
    if (!role) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Role not found')
    }

    const updateData: RoleUpdate = {}

    if (input.name !== undefined) {
      updateData.name = input.name
    }

    if (input.description !== undefined) {
      updateData.description = input.description
    }

    try {
      return await roleRepo.update(id, updateData)
    } catch (err) {
      throw mapDbError(err)
    }
  }
}