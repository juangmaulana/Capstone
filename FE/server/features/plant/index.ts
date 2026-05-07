import { db } from '@/server/db'
import { plantModule } from './module'
import { createPlantRepo } from './repo'

export const plant = plantModule({
  plantRepo: createPlantRepo(db),
})
