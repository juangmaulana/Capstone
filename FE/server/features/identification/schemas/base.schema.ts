import { z } from '@/lib/openapi/zod'

export const ImageIdSchema = z.number().min(1).openapi({
  example: 1,
})
export const PlantIdSchema = z.number().min(1).openapi({
  example: 1,
})
export const CondifenceSchema = z.number().min(0).max(1).openapi({
  example: 0.95,
  description: '0 <= confidence <= 1'
})
export const AiResponseSchema = z.string().openapi({
  example: 'This plant is likely a Monstera deliciosa based on leaf patterns.',
})
export const IsSuccessSchema = z.boolean().openapi({
  example: true,
})
export const IdentifiedAtSchema = z.iso.datetime().openapi({
  example: '2024-01-15T10:30:00Z',
})

export const IdentificationBaseSchema = z.object({
  imageId: ImageIdSchema,
  plantId: PlantIdSchema,
  confidence: CondifenceSchema,
  aiResponse: AiResponseSchema,
  isSuccess: IsSuccessSchema,
  identifiedAt: IdentifiedAtSchema,
})