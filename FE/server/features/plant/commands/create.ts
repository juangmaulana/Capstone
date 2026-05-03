import { mapDbError } from '@/lib/db/mappers'
import { toDbInsert } from '../mappers/to-db'
import { PlantRepo } from '../repo'
import { CreatePlantRequest } from '../schemas/create.schema'
import { Plant } from '../model'

export const createPlant = (deps: {
  plantRepo: PlantRepo,
}) => async (input: CreatePlantRequest): Promise<Plant> => {
  const dbInput = toDbInsert(input)
  try {
    return await deps.plantRepo.create(dbInput)
  } catch (err) {
    throw mapDbError(err)
  }
}