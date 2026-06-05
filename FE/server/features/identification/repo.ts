import type { DB, EnrichedIdentificationSelect } from '@/server/db/types'
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

const buildBaseQuery = (db: DB) =>
  db
    .selectFrom('identifications')
    .leftJoin('plants', 'plants.id', 'identifications.plant_id')
    .leftJoin('images', 'images.id', 'identifications.image_id')
    .leftJoin('users as ranger', 'ranger.id', 'identifications.ranger_id')
    .leftJoin('users as uploader', 'uploader.id', 'identifications.uploaded_by')

const enrichedSelect = [
  'identifications.plant_id as plant_id',
  'plants.common_name as plant_name',
  'plants.scientific_name as scientific_name',
  'identifications.image_id as image_id',
  'images.file_path as image_path',
  'images.file_name as image_name',
  'images.file_size as image_size',
  'images.latitude as image_latitude',
  'images.longitude as image_longitude',
  'images.elevation as image_elevation',
  'images.uploaded_at as image_uploaded_at',
  'identifications.ranger_id as ranger_id',
  'ranger.name as ranger_name',
  'identifications.uploaded_by as uploader_id',
  'uploader.name as uploader_name',
] as const

export const createIdentificationRepo = (db: DB): IdentificationRepo => ({
  findAll: async (filter) => {
    const limit = filter.limit
    const offset = (filter.page - 1) * limit

    let query = buildBaseQuery(db)

    if (filter.search !== undefined) {
      query = query.where((eb) =>
        eb.or([
          eb('identifications.ai_response', 'ilike', `%${filter.search}%`),
          eb('plants.common_name', 'ilike', `%${filter.search}%`),
          eb('plants.scientific_name', 'ilike', `%${filter.search}%`),
          eb('images.file_name', 'ilike', `%${filter.search}%`),
        ])
      )
    }

    if (filter.plantId !== undefined) {
      query = query.where('identifications.plant_id', '=', filter.plantId)
    }

    if (filter.isSuccess !== undefined) {
      query = query.where('identifications.is_success', '=', filter.isSuccess)
    }

    const totalResult = await query
      .select((eb) => eb.fn.count<number>('identifications.id').as('count'))
      .executeTakeFirst()
    const total = Number(totalResult?.count ?? 0)

    const data = await query
      .limit(limit)
      .offset(offset)
      .select([
        'identifications.id',
        'identifications.confidence',
        'identifications.ai_response',
        'identifications.is_success',
        'identifications.identified_at',
        ...enrichedSelect,
      ])
      .orderBy('identifications.identified_at', 'desc')
      .$castTo<EnrichedIdentificationSelect>()
      .execute()
      .then(rows => rows.map(toModel))

    return { data, total, limit, page: filter.page }
  },

  findById: async (id) =>
    buildBaseQuery(db)
      .select([
        'identifications.id',
        'identifications.confidence',
        'identifications.ai_response',
        'identifications.is_success',
        'identifications.identified_at',
        ...enrichedSelect,
      ])
      .where('identifications.id', '=', id)
      .$castTo<EnrichedIdentificationSelect>()
      .executeTakeFirst()
      .then(toModelOrNull),
})
