import { parseWithZod } from "@/lib/validation/parse-with-zod";
import { ObservationQuery, ObservationQuerySchema } from "./schema";

export function parseObservationsQuery(req: Request): ObservationQuery {
  const url = new URL(req.url);

  return parseWithZod(ObservationQuerySchema, {
    search: url.searchParams.get("search") ?? undefined,
    risk: url.searchParams.get("risk") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    order: url.searchParams.get("order") ?? undefined,
  });
}