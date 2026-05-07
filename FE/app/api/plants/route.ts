import { NextResponse } from "next/server";
import { getAllPlants } from "@/lib/plant/service";
import { PlantSchema } from "@/lib/plant/schema";

export async function GET() {
  try {
    const plants = await getAllPlants();
    return NextResponse.json(plants.map((p) => PlantSchema.parse(p)));
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch plants" }, { status: 500 });
  }
}