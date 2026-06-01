import { NextResponse } from "next/server";
import { getPlantById } from "@/lib/plant/service";
import { getObservationsByPlantId } from "@/lib/observation/service";
import { PlantSchema } from "@/lib/plant/schema";
import { ObservationListSchema } from "@/lib/observation/schema";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const plantId = parseInt((await params).id, 10);
    const plant = await getPlantById(plantId);
    if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

    const observations = await getObservationsByPlantId(plantId);

    return NextResponse.json({
        plant: PlantSchema.parse(plant),
        observations: ObservationListSchema.parse({ observations }).observations,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch plant" }, { status: 500 });
  }
}
