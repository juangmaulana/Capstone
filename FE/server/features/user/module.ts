import { RoleRepo } from '../role/repo';
import { createUser } from './commands/create-user';
import { deleteUser } from './commands/delete-user';
import { updateUser } from './commands/update-user';
import { getUserByEmail } from './queries/get-user-by-email';
import { getUserById } from './queries/get-user-by-id';
import { listUsers } from './queries/list-users';
import { UserRepo } from './repo';

export const userModule = (deps: { 
  userRepo: UserRepo,
  roleRepo: RoleRepo
}) => {
  const { userRepo, roleRepo } = deps;
  
  return { 
    commands: {
      create: createUser({ userRepo, roleRepo }),
      update: updateUser({ userRepo, roleRepo }),
      delete: deleteUser({ userRepo })
    }, 
    queries: {
      all: listUsers({ userRepo }),
      byId: getUserById({ userRepo }),
      byEmail: getUserByEmail({ userRepo }),
    }};
};