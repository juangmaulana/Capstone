import { PlantSelect } from '@/server/db/types';
import { Plant } from '../model';

export const toModel = (row: PlantSelect): Plant => {
  return {
    id: row.id,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    family: row.family,
    genus: row.genus,
    description: row.botanical_description,
    ecology: row.ecological_information,
    environmentalImpact: row.environmental_impact,
    imagePath: row.image_path,
    updatedAt: row.updated_at,
  }
}

export const toModelOrNull = (
  row: PlantSelect | undefined
): Plant | null => {
  return row ? toModel(row) : null
}