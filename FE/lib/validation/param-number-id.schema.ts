import { z } from 'zod'

export const paramNumberIdSchema = z.object({
  id: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return val;
    return parsed;
  }).pipe(z.number())
})
