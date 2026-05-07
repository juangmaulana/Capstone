import { z } from "zod";
import { PlantSchema } from "../plant/schema";

export const RiskLevelEnum = z.enum(["Critical", "High", "Medium", "Low"]);

export const ObservationSchema = z.object({
  id: z.number(),
  plantId: z.number(),
  location: z.string(),
  date: z.string(),
  risk: RiskLevelEnum,
  source: z.string(),
  confidence: z.number(),
});

export const ObservationListSchema = z.object({
  observations: z.array(ObservationSchema),
});

export const EnrichedObservationSchema = ObservationSchema.extend({
  plant: PlantSchema,
});

export const EnrichedObservationListSchema = z.object({
  observations: z.array(EnrichedObservationSchema),
});

export type Observation = z.infer<typeof ObservationSchema>;
export type RiskLevel = z.infer<typeof RiskLevelEnum>;
export type EnrichedObservation = z.infer<typeof EnrichedObservationSchema>;