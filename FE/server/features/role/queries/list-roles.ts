import { RoleRepo } from '../repo'
import { RoleFilterRequest } from '../schemas/filter.schema'

export const listRoles = (deps: { roleRepo: RoleRepo }) => {
  const { roleRepo } = deps

  return async (filter: RoleFilterRequest) => {
    return await roleRepo.findAll({
      ...filter,
      limit: filter.limit ?? 20,
      page: filter.page ?? 1,
    })
  }
}