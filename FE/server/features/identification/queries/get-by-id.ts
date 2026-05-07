import { ApiError } from '@/lib/api/api-error'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { IdentificationRepo } from '../repo'

export const getIdentificationById = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (id: number) => {
  const identification = await deps.identificationRepo.findById(id)
  if (!identification) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'Identification not found')
  }
  return identification
}
