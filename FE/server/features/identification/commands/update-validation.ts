import { notFound } from '@/lib/api/errors/http.error'
import { IdentificationRepo } from '../repo'
import { UpdateIdentificationValidationRequest } from '../schemas/update-validation.schema'

export const updateIdentificationValidation = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (
  id: number,
  input: UpdateIdentificationValidationRequest & { validatedBy: number },
) => {
  const identification = await deps.identificationRepo.updateValidation(id, input)
  if (!identification) throw notFound(`Identification with id ${id} not found`)

  return identification
}
