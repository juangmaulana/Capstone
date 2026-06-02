import { PlantSelect } from '@/server/db/types';
import { Plant } from '../model';

export const toModel = (row: PlantSelect): Plant => {
  return {
    id: row.id,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    family: row.family,
    genus: row.genus,
    botanicalDescription: row.botanical_description,
    botanicalDescriptionEn: row.botanical_description_en,
    botanicalDescriptionId: row.botanical_description_id,
    ecologicalInformation: row.ecological_information,
    ecologicalInformationEn: row.ecological_information_en,
    ecologicalInformationId: row.ecological_information_id,
    environmentalImpact: row.environmental_impact,
    environmentalImpactEn: row.environmental_impact_en,
    environmentalImpactId: row.environmental_impact_id,
    imagePath: row.image_path,
    kingdom: row.kingdom,
    phylum: row.phylum,
    taxClass: row.tax_class,
    orderRank: row.order_rank,
    taxSpecies: row.tax_species,
    source: row.source,
    imageSource: row.image_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const toModelOrNull = (
  row: PlantSelect | undefined
): Plant | null => {
  return row ? toModel(row) : null
}
