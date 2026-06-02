import { createScientificNameSlug } from "@/lib/plant/scientific-name-author";

export type MapObservation = {
  id: string;
  lat: number;
  lng: number;
  elevation: number;
  species: string;
  location: string;
  date: string;
  identifiedAt: string;
  source: string;
  confidence: number;
  imagePath: string;
  imageFile: string;
  imageSize: string;
};

export const MAP_OBSERVATIONS: MapObservation[] = [
  {
    id: "obs-vachellia-bekol-20251215",
    lat: -7.838,
    lng: 114.375,
    elevation: 78,
    species: "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.",
    location: "Savana Bekol, Baluran",
    date: "2025-12-15",
    identifiedAt: "15 Dec 2025, 09:32",
    source: "Field Survey",
    confidence: 96,
    imagePath: "/sketsa-herbarium-acacia-nilotica.gif",
    imageFile: "obs-vachellia-bekol-20251215.gif",
    imageSize: "186.2 KB",
  },
  {
    id: "obs-lantana-bama-20251120",
    lat: -7.842,
    lng: 114.391,
    elevation: 14,
    species: "Lantana camara L.",
    location: "Pantai Bama, Baluran",
    date: "2025-11-20",
    identifiedAt: "20 Nov 2025, 08:14",
    source: "GBIF Import",
    confidence: 88,
    imagePath: "/sketsa-herbarium-lantana-camara.jpg",
    imageFile: "obs-lantana-bama-20251120.jpg",
    imageSize: "412.8 KB",
  },
  {
    id: "obs-merremia-baluran-20260105",
    lat: -7.815,
    lng: 114.368,
    elevation: 247,
    species: "Merremia hederacea (Burm.f.) Hallier f.",
    location: "Gunung Baluran, Baluran",
    date: "2026-01-05",
    identifiedAt: "05 Jan 2026, 10:47",
    source: "Citizen Science",
    confidence: 78,
    imagePath: "/sketsa-herbarium-merremia-hederacea.jpg",
    imageFile: "obs-merremia-baluran-20260105.jpg",
    imageSize: "398.4 KB",
  },
  {
    id: "obs-clitoria-forest-20260210",
    lat: -7.855,
    lng: 114.410,
    elevation: 22,
    species: "Clitoria ternatea L.",
    location: "Hutan Tropis, Baluran",
    date: "2026-02-10",
    identifiedAt: "10 Feb 2026, 06:28",
    source: "Remote Sensing",
    confidence: 95,
    imagePath: "/sketsa-herbarium-clitoria-ternatea.jpg",
    imageFile: "obs-clitoria-forest-20260210.jpg",
    imageSize: "524.1 KB",
  },
  {
    id: "obs-ageratum-sumber-batang-20260128",
    lat: -7.820,
    lng: 114.385,
    elevation: 61,
    species: "Ageratum conyzoides L.",
    location: "Pos Sumber Batang, Baluran",
    date: "2026-01-28",
    identifiedAt: "28 Jan 2026, 14:05",
    source: "Field Survey",
    confidence: 75,
    imagePath: "/sketsa-herbarium-ageratum-conyzoides-1.jpg",
    imageFile: "obs-ageratum-sumber-batang-20260128.jpg",
    imageSize: "624.9 KB",
  },
  {
    id: "obs-lantana-bekol-20251014",
    lat: -7.805,
    lng: 114.355,
    elevation: 132,
    species: "Lantana camara L.",
    location: "Savana Bekol, Baluran",
    date: "2025-10-14",
    identifiedAt: "14 Oct 2025, 16:42",
    source: "GBIF Import",
    confidence: 91,
    imagePath: "/sketsa-herbarium-lantana-camara.jpg",
    imageFile: "obs-lantana-bekol-20251014.jpg",
    imageSize: "417.3 KB",
  },
  {
    id: "obs-vachellia-baluran-20250903",
    lat: -7.840,
    lng: 114.360,
    elevation: 214,
    species: "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.",
    location: "Gunung Baluran, Baluran",
    date: "2025-09-03",
    identifiedAt: "03 Sep 2025, 07:55",
    source: "Field Survey",
    confidence: 92,
    imagePath: "/sketsa-herbarium-acacia-nilotica.gif",
    imageFile: "obs-vachellia-baluran-20250903.gif",
    imageSize: "184.7 KB",
  },
  {
    id: "obs-clitoria-bama-20260220",
    lat: -7.845,
    lng: 114.395,
    elevation: 33,
    species: "Clitoria ternatea L.",
    location: "Kawasan Bama, Baluran",
    date: "2026-02-20",
    identifiedAt: "20 Feb 2026, 11:18",
    source: "Citizen Science",
    confidence: 84,
    imagePath: "/sketsa-herbarium-clitoria-ternatea.jpg",
    imageFile: "obs-clitoria-bama-20260220.jpg",
    imageSize: "521.6 KB",
  },
];

export const MAP_SPECIES_COLOR: Record<string, string> = {
  "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.": "#2E7D32",
  "Lantana camara L.": "#1565C0",
  "Merremia hederacea (Burm.f.) Hallier f.": "#6A1B9A",
  "Clitoria ternatea L.": "#E65100",
  "Ageratum conyzoides L.": "#00838F",
};

export const MAP_SPECIES_LIST = Object.keys(MAP_SPECIES_COLOR);

export const getMapObservationById = (id: string) =>
  MAP_OBSERVATIONS.find((observation) => observation.id === id);

export const getMapObservationSpeciesHref = (observation: MapObservation) =>
  `/species/${createScientificNameSlug(observation.species)}`;
