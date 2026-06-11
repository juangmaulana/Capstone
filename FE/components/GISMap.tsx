import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchLocations,
  fetchMapObservations,
  MAP_SPECIES_COLOR,
  type MapLocation,
  type MapObservation,
} from "@/lib/map-observations";

const DEFAULT_CENTER: [number, number] = [-7.833, 114.366];

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MAP_COPY = {
  en: {
    filter: "Plant Filter",
    allPlants: "All plants",
    showing: "Showing",
    date: "Date",
    elevation: "Elevation",
    viewDetails: "View details",
    loading: "Loading plants...",
    empty: "No plants found.",
    images: "images",
  },
  id: {
    filter: "Filter Tanaman",
    allPlants: "Semua tanaman",
    showing: "Menampilkan",
    date: "Tanggal",
    elevation: "Elevasi",
    viewDetails: "Lihat detail",
    loading: "Memuat tanaman...",
    empty: "Tidak ada tanaman ditemukan.",
    images: "gambar",
  },
} as const;

const FALLBACK_SPECIES_COLORS = [
  "#2E7D32",
  "#1565C0",
  "#6A1B9A",
  "#E65100",
  "#00838F",
  "#C62828",
  "#AD1457",
  "#5D4037",
  "#283593",
  "#558B2F",
];

const getUniqueSpeciesColor = (species: string, index: number, usedColors: Set<string>) => {
  const candidates = [
    MAP_SPECIES_COLOR[species],
    FALLBACK_SPECIES_COLORS[index],
    `hsl(${((index * 137.508) % 360).toFixed(3)} 72% 42%)`,
  ].filter(Boolean) as string[];

  let fallbackIndex = 0;
  let color = candidates.shift() ?? "#2E7D32";
  while (usedColors.has(color)) {
    color = candidates.shift() ?? `hsl(${((index * 137.508 + fallbackIndex * 29.7) % 360).toFixed(3)} 72% ${38 + (fallbackIndex % 4) * 5}%)`;
    fallbackIndex += 1;
  }
  usedColors.add(color);
  return color;
};

export function GISMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const locationLayer = useRef<L.LayerGroup | null>(null);
  const [observations, setObservations] = useState<MapObservation[]>([]);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const { language } = useLanguage();
  const copy = MAP_COPY[language];
  const speciesList = useMemo(
    () => Array.from(new Set(observations.map((observation) => observation.species))).sort((a, b) => a.localeCompare(b)),
    [observations],
  );
  const speciesColor = useMemo(() => {
    const usedColors = new Set<string>();
    return Object.fromEntries(
      speciesList.map((species, index) => [species, getUniqueSpeciesColor(species, index, usedColors)])
    );
  }, [speciesList]);
  const selectedSpeciesSet = useMemo(() => new Set(selectedSpecies), [selectedSpecies]);
  const filteredMarkers = useMemo(
    () => observations.filter((marker) => selectedSpeciesSet.has(marker.species)),
    [observations, selectedSpeciesSet],
  );
  const allSelected = speciesList.length > 0 && selectedSpecies.length === speciesList.length;

  const toggleAllSpecies = () => {
    setSelectedSpecies((current) => current.length === speciesList.length ? [] : speciesList);
  };

  const toggleSpecies = (species: string) => {
    setSelectedSpecies((current) =>
      current.includes(species)
        ? current.filter((item) => item !== species)
        : [...current, species],
    );
  };

  useEffect(() => {
    let isMounted = true;

    fetchMapObservations()
      .then((nextObservations) => {
        if (!isMounted) return;
        setObservations(nextObservations);
        setSelectedSpecies(Array.from(new Set(nextObservations.map((observation) => observation.species))).sort((a, b) => a.localeCompare(b)));
      })
      .catch((error) => {
        console.error("Failed to load map plants:", error);
        if (isMounted) {
          setObservations([]);
          setSelectedSpecies([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPlants(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLocations = async () => {
      try {
        let nextLocations: MapLocation[];

        if (isLoadingPlants || allSelected) {
          nextLocations = await fetchLocations();
        } else if (selectedSpecies.length === 0) {
          nextLocations = [];
        } else {
          const results = await Promise.all(selectedSpecies.map((species) => fetchLocations(species)));
          const merged = new Map<string, MapLocation>();
          results.flat().forEach((location) => {
            const key = `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;
            const existing = merged.get(key);
            if (existing) {
              existing.imageCount += location.imageCount;
            } else {
              merged.set(key, { ...location });
            }
          });
          nextLocations = Array.from(merged.values());
        }

        if (isMounted) setLocations(nextLocations);
      } catch (error) {
        console.error("Failed to load map locations:", error);
        if (isMounted) setLocations([]);
      }
    };

    loadLocations();

    return () => {
      isMounted = false;
    };
  }, [isLoadingPlants, allSelected, selectedSpecies]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markerLayer.current = L.layerGroup().addTo(map);
    locationLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    // Fix map responsive behavior: Observe parent size changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstance.current = null;
      markerLayer.current = null;
      locationLayer.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markerLayer.current;
    if (!layer) return;

    layer.clearLayers();

    filteredMarkers.forEach((observation) => {
      const color = speciesColor[observation.species] || "#2E7D32";
      const detailsHref = `/map/observations/${observation.id}`;
      const marker = L.circleMarker([observation.lat, observation.lng], {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(layer);

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:600">${escapeHtml(observation.species)}</h3>
          <p style="margin:4px 0;font-size:12px;color:#888;font-weight:500">${escapeHtml(observation.location)}</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.elevation}: ${observation.elevation} m dpl</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.date}: ${escapeHtml(observation.date)}</p>
          <p style="margin:0;font-size:11px;color:#666">${observation.lat.toFixed(5)}°, ${observation.lng.toFixed(5)}°</p>
          <a
            href="${escapeHtml(detailsHref)}"
            style="display:inline-flex;align-items:center;justify-content:center;margin-top:10px;border-radius:6px;background:${color};color:white;padding:7px 10px;font-size:12px;font-weight:600;text-decoration:none"
          >
            ${copy.viewDetails}
          </a>
        </div>
      `);
    });
  }, [copy.date, copy.elevation, copy.viewDetails, filteredMarkers, speciesColor]);

  useEffect(() => {
    const layer = locationLayer.current;
    if (!layer) return;

    layer.clearLayers();

    locations.forEach((location) => {
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50% 50% 50% 0;background:#D32F2F;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);transform:rotate(-45deg)">
            <span style="transform:rotate(45deg);color:white;font-size:10px;font-weight:700">${location.imageCount}</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const marker = L.marker([location.lat, location.lng], { icon }).addTo(layer);

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:160px">
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:600">${escapeHtml(location.name)}</h3>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.elevation}: ${location.elevation} m dpl</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${location.imageCount} ${copy.images}</p>
          <p style="margin:0;font-size:11px;color:#666">${location.lat.toFixed(5)}°, ${location.lng.toFixed(5)}°</p>
        </div>
      `);
    });
  }, [copy.elevation, copy.images, locations]);

  return (
    <div className="relative isolate h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />

      {/* Plant Filter */}
      <div className="absolute left-6 top-6 z-[1000] max-w-[300px] rounded-lg border border-border bg-background/90 p-3 shadow-lg backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-foreground">{copy.filter}</p>
          <span className="text-[10px] font-medium text-muted-foreground">
            {copy.showing} {filteredMarkers.length}/{observations.length}
          </span>
        </div>
        <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-[11px] font-semibold text-foreground hover:bg-muted/60">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAllSpecies}
            className="h-3.5 w-3.5 accent-primary"
          />
          {copy.allPlants}
        </label>
        <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
          {isLoadingPlants && (
            <p className="rounded-md bg-muted/60 px-2 py-2 text-[11px] text-muted-foreground">{copy.loading}</p>
          )}
          {!isLoadingPlants && speciesList.length === 0 && (
            <p className="rounded-md bg-muted/60 px-2 py-2 text-[11px] text-muted-foreground">{copy.empty}</p>
          )}
          {speciesList.map((species) => (
            <label key={species} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
              <input
                type="checkbox"
                checked={selectedSpeciesSet.has(species)}
                onChange={() => toggleSpecies(species)}
                className="h-3.5 w-3.5 accent-primary"
              />
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: speciesColor[species] }}
              />
              <span className="text-[10px] font-medium leading-tight text-foreground">{species}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
