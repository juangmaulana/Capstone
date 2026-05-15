import { PlantSelect } from '@/server/db/types'
import { Plant } from '../model'

export const toModel = (row: PlantSelect): Plant => {
  return new Plant(
    row.id,
    row.common_name,
    row.scientific_name,
    row.family,
    row.genus,
    row.botanical_description,
    row.ecological_information,
    row.environmental_impact,
    row.botanical_description_en,
    row.botanical_description_id,
    row.ecological_information_en,
    row.ecological_information_id,
    row.environmental_impact_en,
    row.environmental_impact_id,
    row.image_path,
    row.created_at,
    row.updated_at,
  )
}

export const toModelOrNull = (
  row: PlantSelect | undefined
): Plant | null => {
  return row ? toModel(row) : null
}
