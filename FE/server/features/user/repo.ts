import { User } from './models/user.model';
import { DB, UserUpdate } from '@/server/db/types';
import { toUser, toUserOrNull } from './mappers/to-model';

export type UserFilter = {
  search?: string
  roleId?: number
  limit: number
  page: number
}

export type UserRepo = {
  findAll(filter: UserFilter): Promise<{
    data: User[],
    total: number,
    limit: number,
    page: number,
  }>
  findById(id: number): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  update(id: number, data: UserUpdate): Promise<User | null>
  delete(id: number): Promise<boolean>
}

export const createUserRepo = (db: DB): UserRepo => ({
  findAll: async (filter) => {
    const limit = filter.limit;
    const offset = (filter.page - 1) * limit;

    let query = db.selectFrom('users')

    if (filter.search !== undefined) {
      query = query.where((eb) =>
        eb.or([
          eb("name", "ilike", `%${filter.search}%`),
          eb("email", "ilike", `%${filter.search}%`)
        ])
      )
    }

    if (filter.roleId !== undefined)
      query = query.where('role_id', '=', filter.roleId)

    const totalResult = await query
      .select((eb) => eb.fn.count<number>('id').as('count'))
      .executeTakeFirst()
    const total = Number(totalResult?.count ?? 0)

    const data = await query
      .limit(limit)
      .offset(offset)
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .selectAll('users')
      .select(['roles.name as role_name'])
      .orderBy('created_at', 'desc')
      .execute()
      .then(rows => rows.map(toUser)) 

    return { data, total, limit, page: filter.page }
  },

  findById: async (id) =>
    db.selectFrom('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .selectAll('users')
      .select(['roles.name as role_name'])
      .where('users.id', '=', id)
      .executeTakeFirst()
      .then(toUserOrNull),

  findByEmail: async (email) =>
    db.selectFrom('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .selectAll('users')
      .select(['roles.name as role_name'])
      .where('email', '=', email)
      .executeTakeFirst()
      .then(toUserOrNull),

  update: async (id, data) => {
    return db.transaction().execute(async (trx) => {
      const user = await trx
        .updateTable('users')
        .set(data)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirstOrThrow();

      return trx
        .selectFrom('users')
        .innerJoin('roles', 'roles.id', 'users.role_id')
        .selectAll('users')
        .select(['roles.name as role_name'])
        .where('users.id', '=', user.id)
        .executeTakeFirstOrThrow()
        .then(toUserOrNull);
      })
    },

  delete: async (id) => {
    const result = await db.deleteFrom('users')
      .where('id', '=', id)
      .executeTakeFirst()

    if (Number(result.numDeletedRows) === 0) {
      return false;
    }

    return true;
  }
})