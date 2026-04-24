import { ObservationListSchema } from "../observation/schema";
import { Plant, PlantSchema } from "./schema";

export async function getPlants() {
  const res = await fetch("/api/plants");
  if (!res.ok) throw new Error("Failed to fetch plants");
  const data = await res.json();
  return PlantSchema.parse(data);
}

export async function getPlantById(id: number) {
  const res = await fetch(`/api/plants/${id}`);
  if (!res.ok) throw new Error("Plant not found");
  const json = await res.json();

  const plant: Plant = PlantSchema.parse(json.plant);
  const observations = ObservationListSchema.parse({ observations: json.observations });

  return { plant, observations: observations.observations };
}