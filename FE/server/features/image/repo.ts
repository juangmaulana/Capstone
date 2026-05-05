import { DB } from '@/server/db/types'
import { Image } from './model'
import { toModelOrNull } from './mappers/to-model'

export type ImageRepo = {
  findById(id: number): Promise<Image | null>
}

export const createImageRepo = (db: DB): ImageRepo => ({
  findById: (id) => 
    db.selectFrom('images')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
      .then(toModelOrNull),
})