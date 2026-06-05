import { ApiError } from '@/lib/api/api-error';
import { UserRepo } from '../repo';
import { ErrorCode } from '@/lib/api/errors/error-codes';
import bcrypt from 'bcryptjs';
import { mapDbError } from '@/lib/db/mappers';
import { RoleRepo } from '../../role/repo';
import { UpdateUserRequest } from '../schemas/update-user.schema';
import { UserUpdate } from '@/server/db/types';

export const updateUser = (deps: { 
  userRepo: UserRepo,
  roleRepo: RoleRepo,
}) => {
  const { userRepo, roleRepo } = deps

  return async (id: number, input: UpdateUserRequest) => {
    const user = await userRepo.findById(id)
    if (!user) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'User not found')
    }

    const updateData: Partial<UserUpdate> = {}

    if (input.roleId !== undefined) {
      const role = await roleRepo.findById(input.roleId)
      if (!role) {
        throw new ApiError(ErrorCode.NOT_FOUND, 'Role not found')
      }
      updateData.role_id = input.roleId
    }

    if (input.name !== undefined) {
      updateData.name = input.name
    }

    if (input.email !== undefined) {
      updateData.email = input.email
    }

    if (input.password !== undefined) 
      updateData.password_hash = await bcrypt.hash(input.password, 10)

    if (Object.keys(updateData).length === 0)
      throw new ApiError(ErrorCode.BAD_REQUEST, 'No fields to update')

    try {
      return await userRepo.update(id, updateData)
    } catch (err) {
      throw mapDbError(err)
    }
  }
}
