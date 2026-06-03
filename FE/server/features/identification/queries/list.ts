import { mapDbError } from '@/lib/db/mappers'
import { IdentificationRepo } from '../repo'
import { IdentificationFilterRequest } from '../schemas/filter.schema'

export const listIdentifications = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (filter: IdentificationFilterRequest) => {
  try {
    return await deps.identificationRepo.findAll({
      ...filter,
      limit: filter.limit ?? 20,
      page: filter.page ?? 1, 
    })
  } catch (err) {
    throw mapDbError(err)
  }
}