import { DB } from '@/server/db/types'
import { Identification } from './model'
import { toModel, toModelOrNull } from './mappers/to-model'

export type IdentificationFilter = {
  search?: string
  plantId?: number
  isSuccess?: boolean
  limit: number
  page: number
}

export type IdentificationRepo = {
  findAll(filter: IdentificationFilter): Promise<{
    data: Identification[],
    total: number,
    limit: number,
    page: number,
  }>
  findById(id: number): Promise<Identification | null>
}

export const createIdentificationRepo = (db: DB): IdentificationRepo => ({
  findAll: async (filter) => {
    const limit = filter.limit;
    const offset = (filter.page - 1) * limit;
    
    let query = db.selectFrom('identifications')

    if (filter.search !== undefined) {
      query = query.where((eb) =>
        eb.or([
          eb('ai_response', 'ilike', `%${filter.search}%`),
        ])
      )
    }

    if (filter.plantId !== undefined) {
      query = query.where('plant_id', '=', filter.plantId)
    }

    if (filter.isSuccess !== undefined) {
      query = query.where('is_success', '=', filter.isSuccess)
    }

    const totalResult = await query
      .select((eb) => eb.fn.count<number>('id').as('count'))
      .executeTakeFirst()
    const total = Number(totalResult?.count ?? 0)

    const data = await query
      .limit(limit)
      .offset(offset)
      .selectAll()
      .orderBy('identified_at', 'desc')
      .execute()
      .then(rows => rows.map(toModel))

    return { data, total, limit, page: filter.page }
  },

  findById: async (id) => 
    db.selectFrom('identifications')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
      .then(toModelOrNull),
})