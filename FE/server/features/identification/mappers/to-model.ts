import { EnrichedIdentificationSelect } from '@/server/db/types'
import { Identification } from '../model/identification.model'
import { Image } from '../model/image.model'

export const toIdentification = (row: EnrichedIdentificationSelect): Identification => {
  return new Identification(
    row.id,
    row.confidence,
    row.ai_response,
    row.is_success,
    row.validation_status ?? 'pending',
    row.identified_at,
    row.validated_at,
    row.notes,

    // image
    row.image_id !== null
      ? new Image(
          row.image_id,
          row.image_name!,
          row.image_path!,
          row.image_size!,
          row.image_latitude!,
          row.image_longitude!,
          row.image_elevation!,
          row.image_uploaded_at!
        )
      : undefined,

    // plant
    row.plant_id !== null
      ? {
          id: row.plant_id,
          name: row.plant_name!,
        }
      : undefined,

    // ranger
    row.ranger_id !== null
      ? {
          id: row.ranger_id,
          name: row.ranger_name!,
        }
      : undefined,

    // uploader
    row.uploader_id !== null
      ? {
          id: row.uploader_id,
          name: row.uploader_name!,
        }
      : undefined,

    // validator
    row.validator_id !== null
      ? {
          id: row.validator_id,
          name: row.validator_name!,
          email: row.validator_email!,
        }
      : undefined,
  )
}

export const toIdentificationOrNull = (
  row: EnrichedIdentificationSelect | undefined
): Identification | null => {
  return row ? toIdentification(row) : null
}
