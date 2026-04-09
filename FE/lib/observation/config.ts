import { RiskLevel } from "./schema";

export const riskVariant: Record<
  RiskLevel,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Critical: "destructive",
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
};