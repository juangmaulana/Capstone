import { notFound } from '@/lib/api/errors/http.error'
import { mapDbError } from '@/lib/db/mappers'
import { IdentificationRepo } from '../repo'

export const deleteIdentification = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (id: number) => {
  try {
    const identification = await deps.identificationRepo.delete(id)
    if (!identification) throw notFound(`Identification with id ${id} not found`)
    return identification
  } catch (err) {
    throw mapDbError(err)
  }
}
