import { User } from '../model'
import { UserRepo } from '../repo'
import { ListUsersQuery } from '../schemas/list-users.schema'

export function listUsers(deps: { userRepo: UserRepo }) {
  const { userRepo } = deps

  return async (input: ListUsersQuery): Promise<User[]> => {
    return await userRepo.findAll({
      search: input.search,
      roleId: input.roleId,
      limit: Math.min(input.limit ?? 20, 100),
      offset: Math.max(input.offset ?? 0, 0),
    })
  }
}