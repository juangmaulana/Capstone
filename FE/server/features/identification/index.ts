import { db } from '@/server/db';
import { createIdentificationModule } from './module';
import { createIdentificationRepo } from './repo';

export const identification = createIdentificationModule({
  identificationRepo: createIdentificationRepo(db)
})