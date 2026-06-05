import { UserRepo } from '../repo'
import { UserFilterRequest } from '../schemas/filter.schema'

export function listUsers(deps: { userRepo: UserRepo }) {
  const { userRepo } = deps

  return async (filter: UserFilterRequest) => {
    return await userRepo.findAll({
      ...filter,
      limit: filter.limit ?? 20,
      page: filter.page ?? 1,
    })
  }
}