import { z } from "zod";

export const ImageSchema = z.object({
  id: z.number(),
  fileName: z.string(),
  fileSize: z.number(),
  imagePath: z.string(),
  lattitude: z.number(),
  longitude: z.number(),
});

export type Image = z.infer<typeof ImageSchema>;