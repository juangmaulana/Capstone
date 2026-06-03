import { User } from './model';
import { DB, UserInsert, UserUpdate } from '@/server/db/types';
import { toDomain } from './mappers/to-domain';

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
  create(data: UserInsert): Promise<User>
  update(id: number, data: UserUpdate): Promise<User | null>
  delete(id: number): Promise<User | null>
  countByRoleId(roleId: number): Promise<number>
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
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute()
      .then(rows => rows.map(toDomain))

    return { data, total, limit, page: filter.page }
  },

  findById: async (id) =>
    db.selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
      .then(row => (row ? toDomain(row) : null)),

  findByEmail: async (email) =>
    db.selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst()
      .then(row => (row ? toDomain(row) : null)),

  create: async (data) =>
    db.insertInto('users')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow()
      .then(toDomain),

  update: async (id, data) =>
    db.updateTable('users')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
      .then(row => (row ? toDomain(row) : null)),

  delete: async (id) =>
    db.deleteFrom('users')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
      .then(row => (row ? toDomain(row) : null)),

  countByRoleId: async (roleId) =>
    db.selectFrom('users')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('role_id', '=', roleId)
      .executeTakeFirst()
      .then((r) => Number(r?.count ?? 0))
})