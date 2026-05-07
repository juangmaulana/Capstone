import { mapDbError } from '@/lib/db/mappers'
import { IdentificationRepo } from '../repo'
import { IdentificationFilter } from '../types/filter'

export const listIdentifications = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (filter: IdentificationFilter) => {
  try {
    return await deps.identificationRepo.findAll(filter)
  } catch (err) {
    throw mapDbError(err)
  }
}
