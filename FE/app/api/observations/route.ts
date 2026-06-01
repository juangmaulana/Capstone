import { NextResponse } from "next/server";
import { getObservations, ObservationQuery } from "@/lib/observation/service";
import { EnrichedObservationListSchema } from "@/lib/observation/schema";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query: ObservationQuery = {
      search: url.searchParams.get("search") ?? undefined,
      risk: url.searchParams.get("risk") ?? undefined,
      sort: (url.searchParams.get("sort") as "date" | "confidence") ?? undefined,
      order: (url.searchParams.get("order") as "asc" | "desc") ?? "asc",
    };

    const observations = await getObservations(query);

    return NextResponse.json(EnrichedObservationListSchema.parse({ observations }));
  } catch {
    return NextResponse.json({ error: "Failed to fetch observations" }, { status: 500 });
  }
}
