import { RoleSelect } from '@/server/db/types';
import { Role } from '../model';

export const toDomain = (row: RoleSelect): Role => ({
  id: row.id,
  name: row.name,
  description: row.description,
})