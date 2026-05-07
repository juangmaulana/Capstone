import { db } from '@/server/db'
import { identificationModule } from './module'
import { createIdentificationRepo } from './repo'

export const identification = identificationModule({
  identificationRepo: createIdentificationRepo(db),
})
