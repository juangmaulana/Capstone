import { DB } from '@/server/db/types'
import { Identification } from './model/identification.model'
import { toIdentification, toIdentificationOrNull } from './mappers/to-model'
import { sql } from 'kysely'

export type IdentificationFilter = {
  search?: string
  plantId?: number
  isSuccess?: boolean
  limit: number
  page: number
}
export type StatisticFilter = {
  startDate: Date,
  endDate: Date,
  plantId?: number,
}

export type IdentificationRepo = {
  findAll(filter: IdentificationFilter): Promise<{
    data: Identification[],
    total: number,
    limit: number,
    page: number,
  }>
  findById(id: number): Promise<Identification | null>
  updateValidation(id: number, adminId: number): Promise<Identification | null>
  updateBoundingBox(id: number, box: {
    x1: number,
    x2: number,
    y1: number,
    y2: number,
    plantId?: number,
  }): Promise<Identification | null>
  delete(id: number): Promise<Identification | null>
  statistics(filter: StatisticFilter): Promise<{
    total: number,
    monthly: {
      month: number,
      count: number,
    }[],
    species: {
      plantId: number,
      count: number,
    }[]
  }>
}

const baseIdentificationQuery = (db: DB) =>
  db.selectFrom('identifications')
    .leftJoin('images', 'images.id', 'identifications.image_id')
    .leftJoin('plants', 'plants.id', 'identifications.plant_id')
    .leftJoin('users as ranger', 'ranger.id', 'identifications.ranger_id')
    .leftJoin('users as admin', 'admin.id', 'identifications.admin_id')
    .leftJoin('users as uploader', 'uploader.id', 'images.uploaded_by')
    .selectAll('identifications')
    .select([
      'images.id as image_id',
      'images.file_name as image_name',
      'images.file_path as image_path',
      'images.file_size as image_size',
      'images.latitude as image_latitude',
      'images.longitude as image_longitude',
      'images.elevation as image_elevation',
      'images.bb_x1 as image_bb_x1',
      'images.bb_x2 as image_bb_x2',
      'images.bb_y1 as image_bb_y1',
      'images.bb_y2 as image_bb_y2',
      'images.uploaded_at as image_uploaded_at',

      'plants.id as plant_id',
      'plants.scientific_name as plant_name',

      'ranger.id as ranger_id',
      'ranger.name as ranger_name',

      'admin.id as admin_id',
      'admin.name as admin_name',

      'uploader.id as uploader_id',
      'uploader.name as uploader_name',
    ])

export const createIdentificationRepo = (db: DB): IdentificationRepo => ({
  findAll: async (filter) => {
    const limit = filter.limit;
    const offset = (filter.page - 1) * limit;

    // Build the base query with all filters applied once.
    // This single query is reused for both COUNT and data fetch
    // so that the pagination total is always consistent with the rows returned.
    let filteredQuery = db.selectFrom('identifications')

    if (filter.search !== undefined) {
      filteredQuery = filteredQuery.where((eb) =>
        eb.or([
          eb('ai_response', 'ilike', `%${filter.search}%`),
        ])
      )
    }

    if (filter.plantId !== undefined) {
      filteredQuery = filteredQuery.where('plant_id', '=', filter.plantId)
    }

    if (filter.isSuccess !== undefined) {
      filteredQuery = filteredQuery.where('is_success', '=', filter.isSuccess)
    }

    const totalResult = await filteredQuery
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst()
    const total = Number(totalResult?.count ?? 0)

    const data = await filteredQuery
      .limit(limit)
      .offset(offset)
      .leftJoin('images', 'images.id', 'identifications.image_id')
      .leftJoin('plants', 'plants.id', 'identifications.plant_id')
      .leftJoin('users as ranger', 'ranger.id', 'identifications.ranger_id')
      .leftJoin('users as admin', 'admin.id', 'identifications.admin_id')
      .leftJoin('users as uploader', 'uploader.id', 'images.uploaded_by')
      .selectAll('identifications')
      .select([
        'images.id as image_id',
        'images.file_name as image_name',
        'images.file_path as image_path',
        'images.file_size as image_size',
        'images.latitude as image_latitude',
        'images.longitude as image_longitude',
        'images.elevation as image_elevation',
        'images.bb_x1 as image_bb_x1',
        'images.bb_x2 as image_bb_x2',
        'images.bb_y1 as image_bb_y1',
        'images.bb_y2 as image_bb_y2',
        'images.uploaded_at as image_uploaded_at',

        'plants.id as plant_id',
        'plants.scientific_name as plant_name',

        'ranger.id as ranger_id',
        'ranger.name as ranger_name',

        'admin.id as admin_id',
        'admin.name as admin_name',

        'uploader.id as uploader_id',
        'uploader.name as uploader_name',
      ])
      .orderBy('identified_at', 'desc')
      .execute()
      .then(rows => rows.map(toIdentification))

    return { data, total, limit, page: filter.page }
  },

  findById: async (id) =>
    baseIdentificationQuery(db)
      .where('identifications.id', '=', id)
      .executeTakeFirst()
      .then(toIdentificationOrNull),

  updateValidation: async (id, adminId) => {
    const updated = await db
      .updateTable('identifications')
      .set({
        admin_id: adminId,
      })
      .where('identifications.id', '=', id)
      .returning('identifications.id')
      .executeTakeFirst()

    if (!updated) return null

    return baseIdentificationQuery(db)
      .where('identifications.id', '=', updated.id)
      .executeTakeFirst()
      .then(toIdentificationOrNull)
  },

  updateBoundingBox: async (id, box) => {
    const identification = await db
      .selectFrom('identifications')
      .select('image_id')
      .where('identifications.id', '=', id)
      .executeTakeFirst()

    if (!identification) return null

    await db.updateTable('images')
      .set({
        bb_x1: box.x1,
        bb_x2: box.x2,
        bb_y1: box.y1,
        bb_y2: box.y2,
      })
      .where('id', '=', identification.image_id)
      .execute()

    if (box.plantId !== undefined) {
      await db.updateTable('identifications')
        .set({ plant_id: box.plantId })
        .where('identifications.id', '=', id)
        .execute()
    }

    return baseIdentificationQuery(db)
      .where('identifications.id', '=', id)
      .executeTakeFirst()
      .then(toIdentificationOrNull)
  },

  delete: async (id) => {
    const existing = await createIdentificationRepo(db).findById(id)
    if (!existing) return null

    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom('identifications').where('id', '=', id).execute()
      if (existing.image?.id) {
        await trx.deleteFrom('images').where('id', '=', existing.image.id).execute()
      }
    })

    return existing
  },

  statistics: async (filter) => {
    let query = db.selectFrom('identifications')

    query = query
      .where('identifications.identified_at', '>=', filter.startDate)
      .where('identifications.identified_at', '<', filter.endDate)

    if (filter.plantId) {
      query = query.where('plant_id', '=', filter.plantId)
    }

    const total = await query
      .select([
        sql<number>`COUNT(id)::integer`.as('count')
      ])
      .executeTakeFirst()
      .then(r => r?.count ?? 0)

    const monthly = await query
      .select([
        sql<number>`EXTRACT(MONTH FROM identified_at)::integer`.as('month'),
        sql<number>`COUNT(id)::integer`.as('count'),
      ])
      .groupBy('month')
      .orderBy('month')
      .execute()

    const species = await query
      .select([
        'plant_id as plantId',
        sql<number>`COUNT(*)::integer`.as('count'),
      ])
      .groupBy('plantId')
      .orderBy('plantId')
      .execute()

    return {
      total,
      monthly,
      species,
    }
  }
})
