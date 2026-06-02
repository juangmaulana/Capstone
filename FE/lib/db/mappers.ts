import { ApiError } from '@/lib/api/api-error'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { isUniqueViolation } from './errors'

export const mapDbError = (err: unknown): never => {
  if (isUniqueViolation(err)) {
    throw new ApiError(ErrorCode.BAD_REQUEST, 'Duplicate value')
  }

  throw err
}
