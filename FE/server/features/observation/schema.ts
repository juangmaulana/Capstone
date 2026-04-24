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

export const ObservationQuerySchema = z.object({
  search: z.string().optional(),
  risk: RiskLevelEnum.optional().transform((val) => {
    if (!val) return undefined;

    const normalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();

    return RiskLevelEnum.parse(normalized);
  }),
  sort: z.enum(["date", "confidence"]).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});


export type RiskLevel = z.infer<typeof RiskLevelEnum>;
export type Observation = z.infer<typeof ObservationSchema>;
export type EnrichedObservation = z.infer<typeof EnrichedObservationSchema>;
export type ObservationQuery = z.infer<typeof ObservationQuerySchema>;