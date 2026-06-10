import { notFound } from '@/lib/api/errors/http.error'
import { IdentificationRepo } from '../repo'
import { UpdateBoundingBoxRequest } from '../schemas/update-bounding-box.schema'
import { mapDbError } from '@/lib/db/mappers'

export const updateBoundingBox = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (
  id: number,
  input: UpdateBoundingBoxRequest,
) => {
  try {
    const identification = await deps.identificationRepo.updateBoundingBox(id, input)
    if (!identification) throw notFound(`Identification with id ${id} not found`)

    return identification
  } catch (err) {
    throw mapDbError(err)
  }
}
