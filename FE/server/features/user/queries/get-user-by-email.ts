import { UserRepo } from '../repo'
import { ApiError } from '@/lib/api/api-error'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { User } from '../models/user.model'

export function getUserByEmail(deps: { userRepo: UserRepo }) {
  const { userRepo } = deps

  return async (email: string): Promise<User> => {
    const user = await userRepo.findByEmail(email)
    if (!user) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'User not found')
    }

    return user
  }
}