import { ApiError } from '@/lib/api/api-error';
import { RoleRepo } from '../repo';
import { ErrorCode } from '@/lib/api/errors/error-codes';
import { Role } from '../model';

export const getRoleById = (deps: { roleRepo: RoleRepo }) => {
  const { roleRepo } = deps

  return async (id: number): Promise<Role> => {
    const role = await roleRepo.findById(id)
    if (!role) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Role not found')
    }

    return role
  }
}