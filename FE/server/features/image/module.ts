import { getImageById } from './queries/get-by-id'
import { ImageRepo } from './repo'

export const createImageModule = (deps: {
  imageRepo: ImageRepo,
}) => {
  const { imageRepo } = deps

  return {
    query: {
      byId: getImageById({ imageRepo }),
    },
  }
}