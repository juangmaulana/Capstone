import { RoleRepo } from '../../role/repo'
import { mapDbError } from '@/lib/db/mappers'
import { CreateRoleRequest } from '../schemas/create-role.schema'

export const createRole = (deps: { 
  roleRepo: RoleRepo, 
}) => {
  const { roleRepo } = deps

  return async (input: CreateRoleRequest) => {
    try {
      return await roleRepo.create({
        name: input.name,
        description: input.description,
      })
    } catch (err) {
      throw mapDbError(err)
    }
  }
}