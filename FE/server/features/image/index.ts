import { db } from '@/server/db'
import { createImageRepo } from './repo'
import { getImageById } from './queries/get-by-id'

const imageRepo = createImageRepo(db)

export const image = {
  query: {
    byId: getImageById({ imageRepo }),
  },
}
