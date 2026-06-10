import { UserWithRoleSelect } from '@/server/db/types';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';

export const toUser = (row: UserWithRoleSelect): User => {
  return new User(
    row.id,
    new Role(
      row.role_id,
      row.role_name,
    ),
    row.name,
    row.email,
    row.country,
    row.last_login_at,
    row.created_at,
    row.updated_at,
  );
};

export const toUserOrNull = (row?: UserWithRoleSelect): User | null => {
  return row ? toUser(row) : null;
}
