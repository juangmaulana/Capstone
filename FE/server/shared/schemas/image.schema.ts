import { z } from '@/lib/openapi/zod'

export const ImageFileSchema = z.any()
  .refine(
    (file) => !file || file.type?.startsWith("image/"), {
    message: "File must be an image",
  })
  .openapi({
    type: "string",
    format: "binary",
  })
  
export const ImageSchema = z.object({
  image: ImageFileSchema
})
