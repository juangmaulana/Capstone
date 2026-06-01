import { RiskLevel } from "./schema";

export async function getObservationsQuery(params?: {
  search?: string;
  risk?: RiskLevel;
  sort?: "date" | "confidence";
  order?: "asc" | "desc";
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.risk) query.set("risk", params.risk);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.order) query.set("order", params.order);
  const res = await fetch(`/api/observations?${query}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
