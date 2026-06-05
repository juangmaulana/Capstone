import { ApiError } from '@/lib/api/api-error';
import { UserRepo } from '../repo';
import { ErrorCode } from '@/lib/api/errors/error-codes';
import { mapDbError } from '@/lib/db/mappers';

export const deleteUser = (deps: { userRepo: UserRepo }) => {
  const { userRepo } = deps
  
  return async (id: number) => {
    const user = await userRepo.findById(id)
    if (!user) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'User not found')
    }

    try {
      return await userRepo.delete(id)
    } catch (err) {
      throw mapDbError(err)
    }
  }
}