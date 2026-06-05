import { createRoleRepo } from './repo';
import { roleModule } from './module';
import { db } from '@/server/db';

export const role = roleModule({
  roleRepo: createRoleRepo(db),
})