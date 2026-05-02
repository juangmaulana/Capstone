import { User } from './model';
import { DB, UserInsert, UserUpdate } from '@/server/db/types';
import { UserFilterDTO } from './dto/user-filter.dto';
import { toDomain } from './mappers/to-domain';

export type UserRepo = {
  findAll(filter?: UserFilterDTO): Promise<User[]>
  findById(id: number): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: UserInsert): Promise<User>
  update(id: number, data: UserUpdate): Promise<User | null>
  delete(id: number): Promise<User | null>
  countByRoleId(roleId: number): Promise<number>
}

export const createUserRepo = (db: DB): UserRepo => ({
  findAll: async (filter = {}) => {
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

    if (filter.limit !== undefined)
      query = query.limit(filter.limit) 

    if (filter.offset !== undefined)
      query = query.offset(filter.offset)

    return query.selectAll()
      .execute()
      .then(rows => rows.map(toDomain))
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