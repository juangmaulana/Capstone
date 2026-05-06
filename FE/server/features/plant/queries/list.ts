import { mapDbError } from '@/lib/db/mappers'
import { PlantRepo } from '../repo'
import { PlantFilterRequest } from '../schemas/filter.schema'

export const listPlants = (deps: {
  plantRepo: PlantRepo,
}) => async (filter: PlantFilterRequest) => {
  try {
    return await deps.plantRepo.findAll(filter)
  } catch (err) {
    throw mapDbError(err)
  }
}