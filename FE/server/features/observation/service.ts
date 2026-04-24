import { Observation, ObservationQuery } from "./schema";
import { mockObservations } from "./mock";
import { mockPlants } from "../plant/mock";
import { Plant } from "../plant/schema";

export type EnrichedObservation = Observation & { plant: Plant };

export async function getAllObservations(): Promise<EnrichedObservation[]> {
  return mockObservations.map((obs) => {
    const plant = mockPlants.find((p) => p.id === obs.plantId);
    if (!plant) throw new Error(`Plant with id ${obs.plantId} not found`);
    return { ...obs, plant };
  });
}

export async function getObservations(query?: ObservationQuery): Promise<EnrichedObservation[]> {
  let observations: EnrichedObservation[] = mockObservations.map((obs) => {
    const plant = mockPlants.find((p) => p.id === obs.plantId);
    if (!plant) throw new Error(`Plant with id ${obs.plantId} not found`);
    return { ...obs, plant };
  });

  if (query?.search) {
    const searchLower = query.search.toLowerCase();
    observations = observations.filter(
      (o) =>
        o.plant.commonName.toLowerCase().includes(searchLower) ||
        o.location.toLowerCase().includes(searchLower)
    );
  }

  if (query?.risk && query.risk !== "all") {
    observations = observations.filter((o) => o.risk === query.risk);
  }

  if (query?.sort) {
    observations.sort((a, b) => {
      if (query.sort === "date") {
        return query.order === "desc"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (query.sort === "confidence") {
        return query.order === "desc" ? b.confidence - a.confidence : a.confidence - b.confidence;
      }
      return 0;
    });
  }

  return observations;
}

export async function getObservationsByPlantId(plantId: number): Promise<EnrichedObservation[]> {
  const plant = mockPlants.find((p) => p.id === plantId);
  if (!plant) throw new Error(`Plant with id ${plantId} not found`);

  return mockObservations
    .filter((obs) => obs.plantId === plantId)
    .map((obs) => ({ ...obs, plant }));
}