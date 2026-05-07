import { mapDbError } from '@/lib/db/mappers'
import { PlantRepo } from '../repo'
import { CreatePlantRequest } from '../schemas/create.schema'

export const createPlant = (deps: {
  plantRepo: PlantRepo,
}) => async (input: CreatePlantRequest) => {
  try {
    return await deps.plantRepo.create({
      common_name: input.commonName,
      scientific_name: input.scientificName,
      family: input.family,
      genus: input.genus,
      botanical_description: input.botanicalDescription,
      ecological_information: input.ecologicalInformation,
      environmental_impact: input.environmentalImpact,
      image_path: input.imagePath,
    })
  } catch (err) {
    throw mapDbError(err)
  }
}
