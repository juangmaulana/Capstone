import { createRoleRepo } from './repo';
import { roleModule } from './module';
import { db } from '@/server/db';
import { createUserRepo } from '../user/repo';

export const role = roleModule({
  roleRepo: createRoleRepo(db),
  userRepo: createUserRepo(db),
})