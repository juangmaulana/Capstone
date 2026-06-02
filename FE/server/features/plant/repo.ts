import { DB, PlantInsert, PlantUpdate } from '@/server/db/types';
import { Plant } from './model';
import { toModel, toModelOrNull } from './mappers/to-model';

export type PlantFilter = {
  search?: string
  family?: string
  genus?: string
  limit?: number
  offset?: number
}

export type PlantRepo = {
  findAll(filter?: PlantFilter): Promise<{
    data: Plant[],
    total: number,
    limit: number,
    offset: number,
  }>
  findById(id: number): Promise<Plant | null>
  create(data: PlantInsert): Promise<Plant>
  update(id: number, data: PlantUpdate): Promise<Plant | null>
  delete(id: number): Promise<Plant | null>
}

export const createPlantRepo = (db: DB): PlantRepo => ({
  findAll: async (filter = {}) => {
    const limit = Math.min(filter.limit ?? 20, 100)
    const offset = filter.offset ?? 0

    let query = db.selectFrom('plants')

    if (filter.search !== undefined) {
      query = query.where((eb) =>
        eb.or([
          eb('common_name', 'ilike', `%${filter.search}%`),
          eb('scientific_name', 'ilike', `%${filter.search}%`),
          eb('botanical_description', 'ilike', `%${filter.search}%`),
          eb('ecological_information', 'ilike', `%${filter.search}%`),
          eb('environmental_impact', 'ilike', `%${filter.search}%`),
          eb('botanical_description_en', 'ilike', `%${filter.search}%`),
          eb('botanical_description_id', 'ilike', `%${filter.search}%`),
          eb('ecological_information_en', 'ilike', `%${filter.search}%`),
          eb('ecological_information_id', 'ilike', `%${filter.search}%`),
          eb('environmental_impact_en', 'ilike', `%${filter.search}%`),
          eb('environmental_impact_id', 'ilike', `%${filter.search}%`),
          eb('source', 'ilike', `%${filter.search}%`),
          eb('image_source', 'ilike', `%${filter.search}%`),
        ])
      )
    }

    if (filter.family !== undefined) {
      query = query.where('family', '=', filter.family)
    }

    if (filter.genus !== undefined) {
      query = query.where('genus', '=', filter.genus)
    }

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
      .then(rows => rows.map(toModel))

    return { data, total, limit, offset }
  },

  findById: async (id) =>
    db.selectFrom('plants')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
      .then(toModelOrNull),

  create: async (data) =>
    db.insertInto('plants')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow()
      .then(toModel),

  update: async (id, data) =>
    db.updateTable('plants')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
      .then(toModelOrNull),

  delete: async (id) =>
    db.deleteFrom('plants')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
      .then(toModelOrNull),
})
