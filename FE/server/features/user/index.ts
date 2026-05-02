import { db } from '@/server/db';
import { userModule } from './module';
import { createUserRepo } from './repo';
import { createRoleRepo } from '../role/repo';

export const user = userModule({
  userRepo: createUserRepo(db),
  roleRepo: createRoleRepo(db),
})