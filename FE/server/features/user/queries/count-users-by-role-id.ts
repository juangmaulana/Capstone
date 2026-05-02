import { UserRepo } from '../repo'

export function countUsersByRoleId(deps: { userRepo: UserRepo }) {
  const { userRepo } = deps

  return async (roleId: number): Promise<number> => {
    return await userRepo.countByRoleId(roleId)
  }
}