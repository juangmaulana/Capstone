import { z } from '@/lib/openapi/zod'
import { PlantBaseSchema } from './base.schema';
import { ImageFileSchema } from '@/server/shared/schemas/image.schema';

export const UpdatePlantSchema = PlantBaseSchema.partial().openapi({
  title: 'UpdatePlantRequest',
})

export const UpdatePlantWithFileSchema = UpdatePlantSchema
  .omit({
    imagePath: true,
  })
  .extend({
    imageFile: ImageFileSchema.optional()
  })
  .openapi({
    title: 'UpdatePlantWithFileRequest',
  })

export type UpdatePlantRequest = z.infer<typeof UpdatePlantSchema>;
