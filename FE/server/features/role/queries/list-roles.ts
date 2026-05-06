import { Role } from '../model'
import { RoleRepo } from '../repo'
import { ListRolesQuery } from '../schemas/list-roles.schema'

export const listRoles = (deps: { roleRepo: RoleRepo }) => {
  const { roleRepo } = deps

  return async (input: ListRolesQuery): Promise<Role[]> => {
    return await roleRepo.findAll({
      search: input.search,
      limit: Math.min(input.limit ?? 20, 100),
      offset: Math.max(input.offset ?? 0, 0),
    })
  }
}