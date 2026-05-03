import { PlantInsert, PlantUpdate } from '@/server/db/types';
import { CreatePlantRequest } from '../schemas/create.schema';
import { UpdatePlantRequest } from '../schemas/update.schema';

export const toDbInsert = (input: CreatePlantRequest): PlantInsert => ({
  common_name: input.commonName,
  scientific_name: input.scientificName,
  family: input.family,
  genus: input.genus,
  botanical_description: input.botanicalDescription,
  ecological_information: input.ecologicalInformation,
  environmental_impact: input.environmentalImpact,
  image_path: input.referenceImagePath,
});

export const toDbUpdate = (input: UpdatePlantRequest): PlantUpdate => ({
  ...(input.commonName !== undefined && { common_name: input.commonName }),
  ...(input.scientificName !== undefined && { scientific_name: input.scientificName }),
  ...(input.family !== undefined && { family: input.family }),
  ...(input.genus !== undefined && { genus: input.genus }),
  ...(input.botanicalDescription !== undefined && { botanical_description: input.botanicalDescription }),
  ...(input.ecologicalInformation !== undefined && { ecological_information: input.ecologicalInformation  }),
  ...(input.environmentalImpact !== undefined && { environmental_impact: input.environmentalImpact }),
  ...(input.referenceImagePath !== undefined && { image_path: input.referenceImagePath }),
});