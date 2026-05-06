import { DB } from '@/server/db/types'
import { Identification } from './model'
import { IdentificationFilter } from './types/filter'
import { toModel, toModelOrNull } from './mappers/to-model'

export type IdentificationRepo = {
  findAll(filter?: IdentificationFilter): Promise<{
    data: Identification[],
    total: number,
    limit: number,
    offset: number,
  }>
  findById(id: number): Promise<Identification | null>
}

export const createIdentificationRepo = (db: DB): IdentificationRepo => ({
  findAll: async (filter = {}) => {
    const limit = Math.min(filter.limit ?? 20, 100)
    const offset = filter.offset ?? 0
    
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

    return { data, total, limit, offset }
  },

  findById: async (id) => 
    db.selectFrom('identifications')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
      .then(toModelOrNull),
})