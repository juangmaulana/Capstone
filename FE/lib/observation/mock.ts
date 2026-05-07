import { Observation } from "./schema";

export const mockObservations: Observation[] = [
  { id: 1, plantId: 1, location: "Savana Bekol", date: "2025-12-15", risk: "Critical", source: "Field Survey", confidence: 96 },
  { id: 2, plantId: 2, location: "Pantai Bama", date: "2025-11-20", risk: "High", source: "GBIF Import", confidence: 88 },
  { id: 3, plantId: 3, location: "Gunung Baluran", date: "2026-01-05", risk: "Medium", source: "Citizen Science", confidence: 78 },
  { id: 4, plantId: 4, location: "Hutan Tropis Baluran", date: "2026-02-10", risk: "High", source: "Remote Sensing", confidence: 95 },
  { id: 5, plantId: 5, location: "Pos Sumber Batang", date: "2026-01-28", risk: "Low", source: "Field Survey", confidence: 75 },
  { id: 6, plantId: 2, location: "Savana Bekol", date: "2025-10-14", risk: "Critical", source: "GBIF Import", confidence: 91 },
  { id: 7, plantId: 1, location: "Gunung Baluran", date: "2025-09-03", risk: "High", source: "Field Survey", confidence: 92 },
  { id: 8, plantId: 4, location: "Kawasan Bama", date: "2026-02-20", risk: "Medium", source: "Citizen Science", confidence: 84 },
  { id: 9, plantId: 3, location: "Hutan Evergreen", date: "2026-03-01", risk: "High", source: "Remote Sensing", confidence: 89 },
  { id: 10, plantId: 1, location: "Padang Savana Timur", date: "2026-03-12", risk: "Critical", source: "Field Survey", confidence: 97 },
];