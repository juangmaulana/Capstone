import { DB } from '@/server/db/types'
import { Identification } from './model/identification.model'
import { toIdentification, toIdentificationOrNull } from './mappers/to-model'
import { sql } from 'kysely'

export type IdentificationFilter = {
  search?: string
  plantId?: number
  isSuccess?: boolean
  validationStatus?: 'pending' | 'validated' | 'rejected'
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
  updateValidation(id: number, input: {
    validationStatus?: 'pending' | 'validated' | 'rejected'
    validatedBy: number
    notes?: string | null
  }): Promise<Identification | null>
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

    if (filter.validationStatus !== undefined) {
      query = query.where('validation_status', '=', filter.validationStatus)
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
      .leftJoin('users as validator', 'validator.id', 'identifications.validated_by')
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

        // validator
        'validator.id as validator_id',
        'validator.name as validator_name',
        'validator.email as validator_email',
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
      .leftJoin('users as validator', 'validator.id', 'identifications.validated_by')
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

        // validator
        'validator.id as validator_id',
        'validator.name as validator_name',
        'validator.email as validator_email',
      ])
      .where('identifications.id', '=', id)
      .executeTakeFirst()
      .then(toIdentificationOrNull),

  updateValidation: async (id, input) => {
    const updateData: {
      validation_status?: 'pending' | 'validated' | 'rejected'
      validated_by?: number | null
      validated_at?: Date | null
      notes?: string | null
    } = {}

    if (input.validationStatus !== undefined) {
      const isValidated = input.validationStatus === 'validated'
      updateData.validation_status = input.validationStatus
      updateData.validated_by = isValidated ? input.validatedBy : null
      updateData.validated_at = isValidated ? new Date() : null
    }

    if (input.notes !== undefined) {
      const normalizedNotes = input.notes?.trim()
      updateData.notes = normalizedNotes ? normalizedNotes : null
    }

    const updated = await db
      .updateTable('identifications')
      .set(updateData)
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirst()

    if (!updated) return null

    return db.selectFrom('identifications')
      .innerJoin('images', 'images.id', 'identifications.image_id')
      .innerJoin('plants', 'plants.id', 'identifications.plant_id')
      .innerJoin('users as ranger', 'ranger.id', 'identifications.ranger_id')
      .innerJoin('users as uploader', 'uploader.id', 'identifications.uploaded_by')
      .leftJoin('users as validator', 'validator.id', 'identifications.validated_by')
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

        // validator
        'validator.id as validator_id',
        'validator.name as validator_name',
        'validator.email as validator_email',
      ])
      .where('identifications.id', '=', id)
      .executeTakeFirst()
      .then(toIdentificationOrNull)
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
