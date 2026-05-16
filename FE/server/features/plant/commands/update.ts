import { mapDbError } from '@/lib/db/mappers'
import { PlantRepo } from '../repo'
import { UpdatePlantRequest } from '../schemas/update.schema'
import { toDbUpdate } from '../mappers/to-db'
import { notFound } from '@/lib/api/errors/http.error'
import { Plant } from '../model'

export const updatePlant = (deps: {
  plantRepo: PlantRepo,
}) => async (id: number, input: UpdatePlantRequest): Promise<Plant> => {
  const dbInput = toDbUpdate(input)
  try {
    const plant = await deps.plantRepo.update(id, dbInput)
    if (!plant) throw notFound(`Plant with id ${id} not found`)

    return plant
  } catch (err) {
    throw mapDbError(err)
  }
}
