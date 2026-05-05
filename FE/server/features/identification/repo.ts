import { DB } from '@/server/db/types'
import { Identification } from './model'
import { IdentificationFilter } from './types/filter'
import { toModel, toModelOrNull } from './mappers/to-model'

export type IdentificationRepo = {
  findAll(filter?: IdentificationFilter): Promise<Identification[]>
  findById(id: number): Promise<Identification | null>
}

export const createIdentificationRepo = (db: DB): IdentificationRepo => ({
  findAll: (filter = {}) => {
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

    if (filter.limit !== undefined) {
      query = query.limit(filter.limit) 
    }

    if (filter.offset !== undefined) {
      query = query.offset(filter.offset)
    }

    return query.selectAll()
      .execute()
      .then(rows => rows.map(toModel))
  },

  findById: (id) => 
    db.selectFrom('identifications')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
      .then(toModelOrNull),
})