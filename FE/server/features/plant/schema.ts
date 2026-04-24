import { z } from "zod";

export const PlantSchema = z.object({
  id: z.number(),
  commonName: z.string(),
  scientificName: z.string(),
  family: z.string(),
  genus: z.string(),
  botanicalDescription: z.string(),
  ecologicalInformation: z.string(),
  environmentalImpact: z.string(),
  referenceImagePath: z.string(),
});

export type Plant = z.infer<typeof PlantSchema>;