import { mapDbError } from '@/lib/db/mappers'
import { IdentificationRepo } from '../repo'
import { notFound } from '@/lib/api/errors/http.error'

export const getIdentificationById = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (id: number) => {
  try {
    const identification = await deps.identificationRepo.findById(id)
    if (!identification) throw notFound(`Identification with id ${id} not found`)
      
    return identification
  } catch (err) {
    throw mapDbError(err)
  }
}