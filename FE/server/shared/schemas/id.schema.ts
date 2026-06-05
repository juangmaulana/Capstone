import { z } from '@/lib/openapi/zod'

export const IdSchema = z.object({
  id: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return val;
    return parsed;
  }).pipe(z.number())
})

export type IdRequest = z.infer<typeof IdSchema>
