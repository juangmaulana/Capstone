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
      botanical_description_en: input.botanicalDescriptionEn ?? input.botanicalDescription,
      botanical_description_id: input.botanicalDescriptionId ?? input.botanicalDescription,
      ecological_information_en: input.ecologicalInformationEn ?? input.ecologicalInformation,
      ecological_information_id: input.ecologicalInformationId ?? input.ecologicalInformation,
      environmental_impact_en: input.environmentalImpactEn ?? input.environmentalImpact,
      environmental_impact_id: input.environmentalImpactId ?? input.environmentalImpact,
      image_path: input.imagePath,
      kingdom: input.kingdom ?? '',
      phylum: input.phylum ?? '',
      tax_class: input.taxClass ?? '',
      order_rank: input.orderRank ?? '',
      tax_species: input.taxSpecies ?? '',
      source: input.source ?? '',
      image_source: input.imageSource ?? '',
    })
  } catch (err) {
    throw mapDbError(err)
  }
}
