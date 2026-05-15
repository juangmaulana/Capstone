import { z } from '@/lib/openapi/zod'

export const IdentificationIdSchema = z.number().min(1).openapi({
  example: 1,
})
export const FileNameSchema = z.string().openapi({
  example: 'identification_1.jpg',
})
export const FilePathSchema = z.string().openapi({
  example: '/uploads/images/identification_1.jpg',
})
export const FileSizeSchema = z.number().min(0).openapi({
  example: 2048000,
  description: 'in Bytes'
})
export const LatitudeSchema = z.number().min(-90).max(90).openapi({
  example: -7.2575,
  description: '-90 <= latitude <= 90'
})
export const LongitudeSchema = z.number().min(-180).max(180).openapi({
  example: 112.7521,
  description: '-180 <= longitude <= 180'
})
export const UploadedAtSchema = z.iso.datetime().openapi({
  example: '2024-01-15T10:30:00Z',
})

export const ImageBaseSchema = z.object({
  identificationId: IdentificationIdSchema,
  fileName: FileNameSchema,
  filePath: FilePathSchema,
  fileSize: FileSizeSchema,
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  uploadedAt: UploadedAtSchema,
})