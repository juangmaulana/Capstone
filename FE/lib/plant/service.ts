import { Plant } from "./schema";
import { mockPlants } from "./mock";

export async function getAllPlants(): Promise<Plant[]> {
  return mockPlants;
}

export async function getPlantById(id: number): Promise<Plant | null> {
  const plant = mockPlants.find((p) => p.id === id);
  return plant || null;
}