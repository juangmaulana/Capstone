import { EnrichedIdentificationSelect } from '@/server/db/types'
import { Identification } from '../model/identification.model'
import { Image } from '../model/image.model'

export const toIdentification = (row: EnrichedIdentificationSelect): Identification => {
  const uploader = row.uploader_id !== null
    ? {
        id: row.uploader_id,
        name: row.uploader_name!,
      }
    : undefined

  return new Identification(
    row.id,
    row.confidence,
    row.ai_response,
    row.is_success,
    row.identified_at,
    row.notes,

    row.image_id !== null
      ? new Image(
          row.image_id,
          row.image_name!,
          row.image_path!,
          row.image_size!,
          row.image_latitude!,
          row.image_longitude!,
          row.image_elevation!,
          row.image_bb_x1!,
          row.image_bb_x2!,
          row.image_bb_y1!,
          row.image_bb_y2!,
          row.image_uploaded_at!,
          uploader,
        )
      : undefined,

    row.plant_id !== null
      ? {
          id: row.plant_id,
          name: row.plant_name!,
        }
      : undefined,

    row.ranger_id !== null
      ? {
          id: row.ranger_id,
          name: row.ranger_name!,
        }
      : undefined,

    uploader,

    row.admin_id !== null
      ? {
          id: row.admin_id,
          name: row.admin_name!,
          email: row.admin_email,
        }
      : undefined,
  )
}

export const toIdentificationOrNull = (
  row: EnrichedIdentificationSelect | undefined
): Identification | null => {
  return row ? toIdentification(row) : null
}
