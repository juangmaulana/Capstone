import { UserSelect } from '@/server/db/types';
import { User } from '../model';

export const toDomain = (row: UserSelect): User => ({
  id: row.id,
  roleId: row.role_id,
  name: row.name,
  email: row.email,
  lastLoginAt: row.last_login_at,
  updatedAt: row.updated_at,
})