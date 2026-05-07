import { ApiError } from '@/lib/api/api-error'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { PlantRepo } from '../repo'

export const getPlantById = (deps: {
  plantRepo: PlantRepo,
}) => async (id: number) => {
  const plant = await deps.plantRepo.findById(id)
  if (!plant) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'Plant not found')
  }
  return plant
}
