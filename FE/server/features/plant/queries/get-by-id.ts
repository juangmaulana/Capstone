import { ApiError } from '@/lib/api/api-error'
import { PlantRepo } from '../repo'
import { ErrorCode } from '@/lib/api/errors/error-codes'

export const getPlantById = (deps: {
  plantRepo: PlantRepo
}) => async (id: number) => {
  const plant = await deps.plantRepo.findById(id)
  if (!plant) {
    throw new ApiError(ErrorCode.NOT_FOUND, `Plant with id ${id} not found`)
  }

  return plant
}