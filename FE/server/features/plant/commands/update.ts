import { mapDbError } from '@/lib/db/mappers'
import { PlantUpdate } from '@/server/db/types'
import { PlantRepo } from '../repo'
import { UpdatePlantRequest } from '../schemas/update.schema'

export const updatePlant = (deps: {
  plantRepo: PlantRepo,
}) => async (id: number, input: UpdatePlantRequest) => {
  try {
    const updateData: PlantUpdate = {
      updated_at: new Date(),
    }

    if (input.commonName !== undefined) updateData.common_name = input.commonName
    if (input.scientificName !== undefined) updateData.scientific_name = input.scientificName
    if (input.family !== undefined) updateData.family = input.family
    if (input.genus !== undefined) updateData.genus = input.genus
    if (input.botanicalDescription !== undefined) updateData.botanical_description = input.botanicalDescription
    if (input.ecologicalInformation !== undefined) updateData.ecological_information = input.ecologicalInformation
    if (input.environmentalImpact !== undefined) updateData.environmental_impact = input.environmentalImpact
    if (input.botanicalDescriptionEn !== undefined) updateData.botanical_description_en = input.botanicalDescriptionEn
    if (input.botanicalDescriptionId !== undefined) updateData.botanical_description_id = input.botanicalDescriptionId
    if (input.ecologicalInformationEn !== undefined) updateData.ecological_information_en = input.ecologicalInformationEn
    if (input.ecologicalInformationId !== undefined) updateData.ecological_information_id = input.ecologicalInformationId
    if (input.environmentalImpactEn !== undefined) updateData.environmental_impact_en = input.environmentalImpactEn
    if (input.environmentalImpactId !== undefined) updateData.environmental_impact_id = input.environmentalImpactId
    if (input.imagePath !== undefined) updateData.image_path = input.imagePath
    if (input.kingdom !== undefined) updateData.kingdom = input.kingdom
    if (input.phylum !== undefined) updateData.phylum = input.phylum
    if (input.taxClass !== undefined) updateData.tax_class = input.taxClass
    if (input.orderRank !== undefined) updateData.order_rank = input.orderRank
    if (input.taxSpecies !== undefined) updateData.tax_species = input.taxSpecies
    if (input.source !== undefined) updateData.source = input.source
    if (input.imageSource !== undefined) updateData.image_source = input.imageSource

    return await deps.plantRepo.update(id, updateData)
  } catch (err) {
    throw mapDbError(err)
  }
}
