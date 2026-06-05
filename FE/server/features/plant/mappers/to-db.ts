import { PlantInsert, PlantUpdate } from '@/server/db/types';
import { CreatePlantRequest } from '../schemas/create.schema';
import { UpdatePlantRequest } from '../schemas/update.schema';

export const toDbInsert = (input: CreatePlantRequest): PlantInsert => ({
  common_name: input.commonName,
  scientific_name: input.scientificName,
  kingdom: input.kingdom,
  phylum: input.phylum,
  class: input.class,
  order: input.order,
  family: input.family,
  genus: input.genus,
  species: input.species,
  botanical_description: input.botanicalDescription,
  ecological_information: input.ecologicalInformation,
  environmental_impact: input.environmentalImpact,
  source_reference: input.sourceReference,
  image_path: input.imagePath,
  image_reference: input.imageReference,
  is_detectable: input.isDetectable,
});

export const toDbUpdate = (input: UpdatePlantRequest): PlantUpdate => ({
  ...(input.commonName !== undefined && { common_name: input.commonName }),
  ...(input.scientificName !== undefined && { scientific_name: input.scientificName }),
  ...(input.kingdom !== undefined && { kingdom: input.kingdom }),
  ...(input.phylum !== undefined && { phylum: input.phylum }),
  ...(input.class !== undefined && { class: input.class }),
  ...(input.order !== undefined && { order: input.order }),
  ...(input.family !== undefined && { family: input.family }),
  ...(input.genus !== undefined && { genus: input.genus }),
  ...(input.species !== undefined && { species: input.species }),
  ...(input.botanicalDescription !== undefined && { botanical_description: input.botanicalDescription }),
  ...(input.ecologicalInformation !== undefined && { ecological_information: input.ecologicalInformation  }),
  ...(input.environmentalImpact !== undefined && { environmental_impact: input.environmentalImpact }),
  ...(input.sourceReference !== undefined && { source_reference: input.sourceReference }),
  ...(input.imagePath !== undefined && { image_path: input.imagePath }),
  ...(input.imageReference !== undefined && { image_reference: input.imageReference }),
  ...(input.isDetectable !== undefined && { is_detectable: input.isDetectable }),
});
