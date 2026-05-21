import { db } from '@/server/db';
import { createImageModule } from './module';
import { createImageRepo } from './repo';

export const image = createImageModule({
  imageRepo: createImageRepo(db),
});
