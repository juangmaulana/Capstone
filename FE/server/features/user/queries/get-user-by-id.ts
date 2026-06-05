import { UserRepo } from '../repo'
import { ApiError } from '@/lib/api/api-error'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { User } from '../model'

export function getUserById(deps: { userRepo: UserRepo }) {
  const { userRepo } = deps

  return async (id: number): Promise<User> => {
    const user = await userRepo.findById(id)
    if (!user) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'User not found')
    }

    return user
  }
}