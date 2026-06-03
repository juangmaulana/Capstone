import { z } from '@/lib/openapi/zod'
import { PlantBaseSchema } from './base.schema';
import { ImageFileSchema } from '@/server/shared/schemas/image.schema';

export const CreatePlantSchema = PlantBaseSchema.openapi({
  title: 'CreatePlantRequest',
})

export const CreatePlantWithFileSchema = CreatePlantSchema
  .omit({
    imagePath: true,
  })
  .extend({
    imageFile: ImageFileSchema
  })
  .openapi({
    title: 'CreatePlantWithFileRequest',
  })

export type CreatePlantRequest = z.infer<typeof CreatePlantSchema>;
