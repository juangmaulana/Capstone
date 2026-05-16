import { PlantInsert, PlantUpdate } from '@/server/db/types';
import { CreatePlantRequest } from '../schemas/create.schema';
import { UpdatePlantRequest } from '../schemas/update.schema';

export const toDbInsert = (input: CreatePlantRequest): PlantInsert => ({
  common_name: input.commonName,
  scientific_name: input.scientificName,
  family: input.family,
  genus: input.genus,
  botanical_description: input.botanicalDescription,
  botanical_description_en: input.botanicalDescriptionEn ?? input.botanicalDescription,
  botanical_description_id: input.botanicalDescriptionId ?? input.botanicalDescription,
  ecological_information: input.ecologicalInformation,
  ecological_information_en: input.ecologicalInformationEn ?? input.ecologicalInformation,
  ecological_information_id: input.ecologicalInformationId ?? input.ecologicalInformation,
  environmental_impact: input.environmentalImpact,
  environmental_impact_en: input.environmentalImpactEn ?? input.environmentalImpact,
  environmental_impact_id: input.environmentalImpactId ?? input.environmentalImpact,
  image_path: input.imagePath,
});

export const toDbUpdate = (input: UpdatePlantRequest): PlantUpdate => ({
  ...(input.commonName !== undefined && { common_name: input.commonName }),
  ...(input.scientificName !== undefined && { scientific_name: input.scientificName }),
  ...(input.family !== undefined && { family: input.family }),
  ...(input.genus !== undefined && { genus: input.genus }),
  ...(input.botanicalDescription !== undefined && { botanical_description: input.botanicalDescription }),
  ...(input.botanicalDescriptionEn !== undefined && { botanical_description_en: input.botanicalDescriptionEn }),
  ...(input.botanicalDescriptionId !== undefined && { botanical_description_id: input.botanicalDescriptionId }),
  ...(input.ecologicalInformation !== undefined && { ecological_information: input.ecologicalInformation  }),
  ...(input.ecologicalInformationEn !== undefined && { ecological_information_en: input.ecologicalInformationEn }),
  ...(input.ecologicalInformationId !== undefined && { ecological_information_id: input.ecologicalInformationId }),
  ...(input.environmentalImpact !== undefined && { environmental_impact: input.environmentalImpact }),
  ...(input.environmentalImpactEn !== undefined && { environmental_impact_en: input.environmentalImpactEn }),
  ...(input.environmentalImpactId !== undefined && { environmental_impact_id: input.environmentalImpactId }),
  ...(input.imagePath !== undefined && { image_path: input.imagePath }),
});
