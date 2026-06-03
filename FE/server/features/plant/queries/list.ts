import { mapDbError } from '@/lib/db/mappers'
import { PlantRepo } from '../repo'
import { PlantFilterRequest } from '../schemas/filter.schema'

export const listPlants = (deps: {
  plantRepo: PlantRepo,
}) => async (filter: PlantFilterRequest) => {
  try {
    return await deps.plantRepo.findAll({
      ...filter,
      limit: filter.limit ?? 20,
      page: filter.page ?? 1,
    })
  } catch (err) {
    throw mapDbError(err)
  }
}