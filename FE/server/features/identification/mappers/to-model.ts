import { EnrichedIdentificationSelect } from '@/server/db/types'
import { Identification } from '../model'

export const toModel = (row: EnrichedIdentificationSelect): Identification => {
  return new Identification(
    row.id,
    row.image_id,
    row.plant_id,
    row.confidence,
    row.ai_response,
    row.is_success,
    row.identified_at,
    row.plant_name,
    row.scientific_name,
    row.image_path,
    row.image_name,
    row.image_size,
    row.image_latitude,
    row.image_longitude,
    row.image_elevation,
    row.image_uploaded_at,
    row.ranger_id,
    row.ranger_name,
    row.uploader_id,
    row.uploader_name,
  )
}

export const toModelOrNull = (
  row: EnrichedIdentificationSelect | undefined
): Identification | null => {
  return row ? toModel(row) : null
}
