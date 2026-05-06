import { DB, RoleInsert, RoleUpdate } from '@/server/db/types';
import { RoleFilter } from './types/role-filter';
import { Role } from './model';
import { toDomain } from './mappers/to-domain';

export type RoleRepo = {
  findAll(filter?: RoleFilter): Promise<Role[]>
  findById(id: number): Promise<Role | null>
  create(data: RoleInsert): Promise<Role>
  update(id: number, data: RoleUpdate): Promise<Role | null>
  delete(id: number): Promise<Role | null>
}

export const createRoleRepo = (db: DB): RoleRepo => ({
  findAll: async (filter = {}) => {
    let query = db.selectFrom('roles')

    if (filter.search !== undefined) {
      query = query.where((eb) =>
        eb.or([
          eb("name", "ilike", `%${filter.search}%`),
          eb("description", "ilike", `%${filter.search}%`)
        ])
      )
    }

    if (filter.limit !== undefined)
      query = query.limit(filter.limit)

    if (filter.offset !== undefined)
      query = query.offset(filter.offset)

    return query.selectAll()
      .execute()
      .then(rows => rows.map(toDomain))
    },

  findById: (id) =>
    db.selectFrom('roles')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
      .then(row => (row ? toDomain(row) : null)),

  create: (data) =>
    db.insertInto('roles')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow()
      .then(toDomain),

  update: (id, data) =>
    db.updateTable('roles')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
      .then(row => (row ? toDomain(row) : null)),

  delete: (id) => 
    db.deleteFrom('roles')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
      .then(row => (row ? toDomain(row) : null)),
})