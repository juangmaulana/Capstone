import { db } from '@/server/db';
import { createPlantModule } from './module';
import { createPlantRepo } from './repo';

export const plant = createPlantModule({
  plantRepo: createPlantRepo(db)
})