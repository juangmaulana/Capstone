import { UserRepo } from '../user/repo'
import { createRole } from './commands/create-role'
import { deleteRole } from './commands/delete-role'
import { updateRole } from './commands/update-role'
import { getRoleById } from './queries/get-role-by-id'
import { listRoles } from './queries/list-roles'
import { RoleRepo } from './repo'

export const roleModule = (deps: {
  roleRepo: RoleRepo,
  userRepo: UserRepo,
}) => {
  const { roleRepo, userRepo } = deps

  return {
    commands: {
      create: createRole({ roleRepo }),
      update: updateRole({ roleRepo }),
      delete: deleteRole({ roleRepo, userRepo }),
    },
    queries: {
      all: listRoles({ roleRepo }),
      byId: getRoleById({ roleRepo }),
    }
  }
}