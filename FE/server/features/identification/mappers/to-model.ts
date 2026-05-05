import { IdentificationSelect } from '@/server/db/types'
import { Identification } from '../model'

export const toModel = (row: IdentificationSelect): Identification => {
  return new Identification(
    row.id,
    row.plant_id,
    row.confidence,
    row.ai_response,
    row.is_success,
    row.identified_at,
  )
}

export const toModelOrNull = (
  row: IdentificationSelect | undefined
): Identification | null => {
  return row ? toModel(row) : null
}