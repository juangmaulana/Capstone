import { mapDbError } from '@/lib/db/mappers';
import { PlantRepo } from '../repo'
import { notFound } from '@/lib/api/errors/http.error';
import { Plant } from '../model';

export const deletePlant = (deps: {
  plantRepo: PlantRepo,
}) => async (id: number): Promise<Plant> => {
  try {
    const plant = await deps.plantRepo.delete(id)
    if (!plant) throw notFound(`Plant with id ${id} not found`)

    return plant
  } catch (err) {
    throw mapDbError(err)
  }
}