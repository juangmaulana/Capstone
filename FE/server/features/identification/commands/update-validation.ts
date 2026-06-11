import { notFound } from '@/lib/api/errors/http.error'
import { IdentificationRepo } from '../repo'
import { UpdateIdentificationValidationRequest } from '../schemas/update-validation.schema'
import { mapDbError } from '@/lib/db/mappers'

export const updateIdentificationValidation = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (
  id: number,
  input: UpdateIdentificationValidationRequest,
) => {
  try {
    const identification = await deps.identificationRepo.updateValidation(id, input)
    if (!identification) throw notFound(`Identification with id ${id} not found`)

    return identification
  } catch (err) {
    throw mapDbError(err)
  }
}
