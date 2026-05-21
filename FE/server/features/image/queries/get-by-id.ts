import { ApiError } from '@/lib/api/api-error'
import { ErrorCode } from '@/lib/api/errors/error-codes'
import { ImageRepo } from '../repo'

export const getImageById = (deps: {
  imageRepo: ImageRepo,
}) => async (id: number) => {
  const imageData = await deps.imageRepo.findById(id)
  if (!imageData) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'Image not found')
  }
  return imageData
}
