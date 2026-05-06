import { UserSelect } from '@/server/db/types';
import { User } from '../model';

export const toDomain = (row: UserSelect): User => ({
  id: row.id,
  roleId: row.role_id,
  name: row.name,
  email: row.email,
})