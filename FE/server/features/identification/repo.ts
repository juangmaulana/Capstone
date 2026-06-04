import { DB } from '@/server/db/types'
import { Identification } from './model/identification.model'
import { toIdentification, toIdentificationOrNull } from './mappers/to-model'

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
      .leftJoin('images', 'images.id', 'identifications.image_id')
      .leftJoin('plants', 'plants.id', 'identifications.plant_id')
      .leftJoin('users as ranger', 'ranger.id', 'identifications.ranger_id')
      .leftJoin('users as uploader', 'uploader.id', 'identifications.uploaded_by')
      .selectAll('identifications')
      .select([
        // images
        'images.id as image_id',
        'images.file_name as image_name',
        'images.file_path as image_path',
        'images.file_size as image_size',
        'images.latitude as image_latitude',
        'images.longitude as image_longitude',
        'images.elevation as image_elevation',
        'images.uploaded_at as image_uploaded_at',
        
        // plant
        'plants.id as plant_id',
        'plants.scientific_name as plant_name',

        // ranger
        'ranger.id as ranger_id',
        'ranger.name as ranger_name',

        // uploader
        'uploader.id as uploader_id',
        'uploader.name as uploader_name',
      ])
      .orderBy('identified_at', 'desc')
      .execute()
      .then(rows => rows.map(toIdentification))

    return { data, total, limit, page: filter.page }
  },

  findById: async (id) => 
    db.selectFrom('identifications')
      .innerJoin('images', 'images.id', 'identifications.image_id')
      .innerJoin('plants', 'plants.id', 'identifications.plant_id')
      .innerJoin('users as ranger', 'ranger.id', 'identifications.ranger_id')
      .innerJoin('users as uploader', 'uploader.id', 'identifications.uploaded_by')
      .selectAll('identifications')
      .select([
        // images
        'images.id as image_id',
        'images.file_name as image_name',
        'images.file_path as image_path',
        'images.file_size as image_size',
        'images.latitude as image_latitude',
        'images.longitude as image_longitude',
        'images.elevation as image_elevation',
        'images.uploaded_at as image_uploaded_at',
        
        // plant
        'plants.id as plant_id',
        'plants.scientific_name as plant_name',

        // ranger
        'ranger.id as ranger_id',
        'ranger.name as ranger_name',

        // uploader
        'uploader.id as uploader_id',
        'uploader.name as uploader_name',
      ])
      .where('identifications.id', '=', id)
      .executeTakeFirst()
      .then(toIdentificationOrNull),
})  