import { mapDbError } from '@/lib/db/mappers'
import { ImageRepo } from '../repo'
import { notFound } from '@/lib/api/errors/http.error'

export const getImageById = (deps: {
  imageRepo: ImageRepo,
}) => async (id: number) => {
  try {
    const image = await deps.imageRepo.findById(id)
    if (!image) throw notFound(`Image with id ${id} not found`)
      
    return image
  } catch (err) {
    throw mapDbError(err)
  }
}