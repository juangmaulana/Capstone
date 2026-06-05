import { listRoles } from './queries/list-roles'
import { RoleRepo } from './repo'

export const roleModule = (deps: {
  roleRepo: RoleRepo,
}) => {
  const { roleRepo } = deps

  return {
    queries: {
      all: listRoles({ roleRepo }),
    }
  }
}