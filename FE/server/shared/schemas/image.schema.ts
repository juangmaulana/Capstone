import { z } from '@/lib/openapi/zod'

export const ImageSchema = z.object({
  image: z.any()
  .refine(
    (file) => file?.type?.startsWith("image/"), {
    message: "File must be an image",
  })
  .openapi({
    type: "string",
    format: "binary",
  }),
})