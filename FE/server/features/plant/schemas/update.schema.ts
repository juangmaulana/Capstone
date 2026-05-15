import { z } from '@/lib/openapi/zod'
import { PlantBaseSchema } from './base.schema';

export const UpdatePlantSchema = PlantBaseSchema.partial()

export type UpdatePlantRequest = z.infer<typeof UpdatePlantSchema>;