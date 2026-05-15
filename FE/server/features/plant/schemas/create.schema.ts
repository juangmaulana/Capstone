import { z } from '@/lib/openapi/zod'
import { PlantBaseSchema } from './base.schema';

export const CreatePlantSchema = PlantBaseSchema

export type CreatePlantRequest = z.infer<typeof CreatePlantSchema>;