import { ImageSelect } from '@/server/db/types'
import { Image } from '../model'

export const toModel = (row: ImageSelect): Image => {
  return new Image(
    row.id,
    row.user_id,
    row.identification_id,
    row.file_name,
    row.file_path,
    row.file_size,
    row.latitude,
    row.longitude,
    row.uploaded_at,
  )
}

export const toModelOrNull = (
  row: ImageSelect | undefined
): Image | null => {
  return row ? toModel(row) : null
}