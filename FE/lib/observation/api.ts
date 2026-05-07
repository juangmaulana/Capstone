import { RiskLevel } from "./schema";

export async function getObservationsQuery(params?: {
  search?: string;
  risk?: RiskLevel;
  sort?: "date" | "confidence";
  order?: "asc" | "desc";
}) {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`/api/observations?${query}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}