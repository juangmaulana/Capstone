import { DB } from '@/server/db/types';
import { Role } from './model';
import { toDomain } from './mappers/to-domain';

export type RoleFilter = {
  search?: string
  limit: number
  page: number
}

export type RoleRepo = {
  findAll(filter: RoleFilter): Promise<{
    data: Role[],
    total: number,
    limit: number,
    page: number,
  }>
  findById(id: number): Promise<Role | null>
}

export const createRoleRepo = (db: DB): RoleRepo => ({
  findAll: async (filter) => {
    const limit = filter.limit;
    const offset = (filter.page - 1) * limit;

    let query = db.selectFrom('roles')

    if (filter.search !== undefined) {
      query = query.where((eb) =>
        eb.or([
          eb("name", "ilike", `%${filter.search}%`),
          eb("description", "ilike", `%${filter.search}%`)
        ])
      )
    }

    const totalResult = await query
      .select((eb) => eb.fn.count<number>('id').as('count'))
      .executeTakeFirst()
    const total = Number(totalResult?.count ?? 0)

    const data = await query
      .limit(limit)
      .offset(offset)
      .selectAll()
      .execute()
      .then(rows => rows.map(toDomain))

    return { data, total, limit, page: filter.page }
  },

  findById: (id) =>
    db.selectFrom('roles')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
      .then(row => (row ? toDomain(row) : null)),
})