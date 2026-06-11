import { createScientificNameSlug, getScientificNameWithAuthor } from "@/lib/plant/scientific-name-author";

export type MapObservation = {
  id: string;
  plantId?: number;
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
  notes: string | null;
};

type IdentificationApiRecord = {
  id: number;
  plantId?: number;
  plant_id?: number;
  confidence?: number;
  isSuccess?: boolean;
  identifiedAt?: string;
  identified_at?: string;
  aiResponse?: string;
  ai_response?: string;
  location?: string;
  locationName?: string;
  location_name?: string;
  address?: string;
  place?: string;
  area?: string;
  plantName?: string;
  scientificName?: string;
  imageUrl?: string;
  image_url?: string;
  fileUrl?: string;
  file_url?: string;
  filePath?: string;
  file_path?: string;
  imagePath?: string;
  image_path?: string;
  imageFile?: string;
  image_file?: string;
  imageName?: string;
  imageSize?: number;
  image_size?: number;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  imageLatitude?: number;
  imageLongitude?: number;
  imageElevation?: number;
  notes?: string | null;
  image?: {
    id?: number;
    name?: string;
    path?: string;
    size?: number;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    uploadedAt?: string;
    uploaded_at?: string;
  };
  plant?: {
    id?: number;
    name?: string;
    scientificName?: string;
    scientific_name?: string;
  };
};

type LocationApiRecord = {
  id?: number;
  name?: string;
  location?: string;
  address?: string;
  place?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  imageCount?: number;
  image_count?: number;
  data?: LocationApiRecord;
};

export type LocationStats = {
  totalLocations: number;
  totalImages: number;
  averageElevation: number;
};

export type MapLocation = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  imageCount: number;
};

export type PlantDetail = {
  id: number;
  scientificName: string;
  commonName: string;
  family: string;
  source?: string;
  imageSource?: string;
};


export const MAP_SPECIES_COLOR: Record<string, string> = {
  "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.": "#2E7D32",
  "Lantana camara L.": "#1565C0",
  "Merremia hederacea (Burm.f.) Hallier f.": "#6A1B9A",
  "Clitoria ternatea L.": "#E65100",
  "Ageratum conyzoides L.": "#00838F",
};

export const MAP_SPECIES_LIST = Object.keys(MAP_SPECIES_COLOR);

export const getMapObservationSpeciesHref = (observation: MapObservation) =>
  `/species/${createScientificNameSlug(observation.species)}`;

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatFileSize = (value?: number) => {
  if (!Number.isFinite(value) || !value) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
};

const pickLocationName = (record: unknown): string | null => {
  if (!record || typeof record !== "object") return null;
  const location = record as LocationApiRecord;
  const candidates = [location.name, location.location, location.address, location.place, location.area];
  const direct = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  if (direct) return direct;
  return pickLocationName(location.data);
};

const unwrapApiData = (payload: unknown): unknown => {
  if (!payload || typeof payload !== "object") return payload;
  const record = payload as { data?: unknown };
  return record.data ?? payload;
};

const getLocationName = async (lat: number, lng: number) => {
  try {
    const response = await fetch(`/api/v1/locations/details?latitude=${lat}&longitude=${lng}`);
    if (!response.ok) return null;
    const json = await response.json();
    return pickLocationName(json.data) || pickLocationName(json);
  } catch (error) {
    console.error("Failed to fetch location details:", error);
    return null;
  }
};

const pickIdentificationLocationName = (record: IdentificationApiRecord) => {
  const candidates = [record.locationName, record.location_name, record.location, record.address, record.place, record.area];
  return candidates.find((value) => typeof value === "string" && value.trim().length > 0) || null;
};

const pickIdentificationImagePath = (record: IdentificationApiRecord) =>
  record.image?.path || record.imageUrl || record.image_url || record.fileUrl || record.file_url || record.imagePath || record.image_path || record.filePath || record.file_path || "/placeholder.svg";

export const fetchLocations = async (species?: string): Promise<MapLocation[]> => {
  try {
    const query = species ? `&species=${encodeURIComponent(species)}` : "";
    const response = await fetch(`/api/v1/locations?limit=250${query}`);
    if (!response.ok) return [];
    const json = await response.json();
    const payload = unwrapApiData(json);
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { locations?: unknown[] })?.locations)
        ? (payload as { locations: unknown[] }).locations
        : Array.isArray((payload as { data?: unknown[] })?.data)
          ? (payload as { data: unknown[] }).data
          : [];

    return records
      .map((record, index) => {
        const location = record as LocationApiRecord;
        const lat = Number(location.latitude);
        const lng = Number(location.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          id: Number(location.id ?? index + 1),
          name: pickLocationName(location) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          lat,
          lng,
          elevation: Number(location.elevation ?? 0),
          imageCount: Number(location.imageCount ?? location.image_count ?? 0),
        };
      })
      .filter((location): location is MapLocation => Boolean(location));
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return [];
  }
};

export const fetchLocationStats = async (): Promise<LocationStats | null> => {
  try {
    const response = await fetch("/api/v1/locations/stats");
    if (!response.ok) return null;
    const json = await response.json();
    const payload = unwrapApiData(json) as Record<string, unknown>;

    return {
      totalLocations: Number(payload.totalLocations ?? payload.total_locations ?? payload.locations ?? 0),
      totalImages: Number(payload.totalImages ?? payload.total_images ?? payload.images ?? 0),
      averageElevation: Number(payload.averageElevation ?? payload.average_elevation ?? 0),
    };
  } catch (error) {
    console.error("Failed to fetch location stats:", error);
    return null;
  }
};

export const fetchNearbyLocations = async (lat: number, lng: number, radius = 5): Promise<MapLocation[]> => {
  try {
    const response = await fetch(`/api/v1/locations/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`);
    if (!response.ok) return [];
    const json = await response.json();
    const payload = unwrapApiData(json);
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { images?: unknown[] })?.images)
        ? (payload as { images: unknown[] }).images
        : Array.isArray((payload as { data?: unknown[] })?.data)
          ? (payload as { data: unknown[] }).data
          : [];

    return records
      .map((record, index) => {
        const location = record as LocationApiRecord & { distance?: number };
        const nextLat = Number(location.latitude);
        const nextLng = Number(location.longitude);
        if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return null;
        return {
          id: Number(location.id ?? index + 1),
          name: pickLocationName(location) || `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`,
          lat: nextLat,
          lng: nextLng,
          elevation: Number(location.elevation ?? 0),
          imageCount: Number(location.imageCount ?? location.image_count ?? 1),
        };
      })
      .filter((location): location is MapLocation => Boolean(location));
  } catch (error) {
    console.error("Failed to fetch nearby locations:", error);
    return [];
  }
};

export const fetchPlantById = async (id: number): Promise<PlantDetail | null> => {
  try {
    const response = await fetch(`/api/v1/plants/${id}`);
    if (!response.ok) return null;
    const json = await response.json();
    const payload = unwrapApiData(json) as Record<string, unknown>;
    return {
      id: Number(payload.id ?? id),
      scientificName: getScientificNameWithAuthor(String(payload.scientificName ?? payload.scientific_name ?? "")),
      commonName: String(payload.commonName ?? payload.common_name ?? ""),
      family: String(payload.family ?? ""),
      source: String(payload.source ?? payload.sourceReference ?? payload.source_reference ?? ""),
      imageSource: String(payload.imageSource ?? payload.imageReference ?? payload.image_reference ?? ""),
    };
  } catch (error) {
    console.error("Failed to fetch plant detail:", error);
    return null;
  }
};

const mapIdentificationToObservation = async (record: IdentificationApiRecord): Promise<MapObservation | null> => {
  const lat = record.image?.latitude ?? record.imageLatitude ?? record.latitude;
  const lng = record.image?.longitude ?? record.imageLongitude ?? record.longitude;
  const elev = record.image?.elevation ?? record.imageElevation ?? record.elevation ?? 0;

  if (!record.id || lat === undefined || lng === undefined) return null;

  const locationName = pickIdentificationLocationName(record) || await getLocationName(lat, lng);
  const plantName = record.plant?.scientificName || record.plant?.scientific_name || record.plant?.name || record.scientificName || record.plantName || record.aiResponse || record.ai_response || "Unknown species";
  const species = getScientificNameWithAuthor(plantName);
  const rawConfidence = typeof record.confidence === 'number' ? record.confidence : 0;
  const confidence = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
  const identifiedAt = record.identifiedAt || record.identified_at;
  const date = identifiedAt ? new Date(identifiedAt) : null;
  const dateValue = date && !Number.isNaN(date.getTime())
    ? date.toISOString().slice(0, 10)
    : formatDate(identifiedAt);

  return {
    id: String(record.id),
    plantId: record.plant?.id ?? record.plantId ?? record.plant_id,
    lat,
    lng,
    elevation: elev,
    species,
    location: locationName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    date: dateValue,
    identifiedAt: formatDateTime(identifiedAt),
    source: "AI Identification API",
    confidence,
    imagePath: pickIdentificationImagePath(record),
    imageFile: record.image?.name || record.imageName || record.imageFile || record.image_file || `identification-${record.id}`,
    imageSize: formatFileSize(record.image?.size ?? record.imageSize ?? record.image_size),
    notes: record.notes ?? null,
  };
};

export const fetchMapObservations = async (): Promise<MapObservation[]> => {
  try {
    const response = await fetch("/api/v1/identifications?limit=100&isSuccess=true");
    if (!response.ok) return [];

    const json = await response.json();
    if (!json.success || !Array.isArray(json.data)) return [];

    const observations = (await Promise.all(
      json.data.map((record: IdentificationApiRecord) => mapIdentificationToObservation(record))
    )).filter((observation): observation is MapObservation => Boolean(observation));

    return observations;
  } catch (error) {
    console.error("Failed to fetch identification observations:", error);
    return [];
  }
};

export const getMapObservationByIdFromApi = async (id: string): Promise<MapObservation | null> => {
  if (!/^\d+$/.test(id)) return null;

  try {
    const response = await fetch(`/api/v1/identifications/${id}`);
    if (!response.ok) return null;

    const json = await response.json();
    if (!json.success || !json.data) return null;

    return await mapIdentificationToObservation(json.data);
  } catch (error) {
    console.error("Failed to fetch identification detail:", error);
    return null;
  }
};
