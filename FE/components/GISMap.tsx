import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchLocations,
  fetchMapObservations,
  fetchNearbyLocations,
  MAP_SPECIES_COLOR,
  type MapLocation,
  type MapObservation,
} from "@/lib/map-observations";

const DEFAULT_CENTER: [number, number] = [-7.833, 114.366];

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MAP_COPY = {
  en: {
    legend: "Species Legend",
    filter: "Plant Filter",
    allPlants: "All plants",
    showing: "Showing",
    date: "Date",
    elevation: "Elevation",
    viewDetails: "View details",
    locations: "Locations",
    nearby: "Nearby images",
  },
  id: {
    legend: "Legenda Spesies",
    filter: "Filter Tanaman",
    allPlants: "Semua tanaman",
    showing: "Menampilkan",
    date: "Tanggal",
    elevation: "Elevasi",
    viewDetails: "Lihat detail",
    locations: "Lokasi",
    nearby: "Gambar sekitar",
  },
} as const;

export function GISMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const [observations, setObservations] = useState<MapObservation[]>([]);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<MapLocation[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const { language } = useLanguage();
  const copy = MAP_COPY[language];
  const speciesList = useMemo(() => Array.from(new Set(observations.map((observation) => observation.species))), [observations]);
  const speciesColor = useMemo(() => {
    const colors = ["#2E7D32", "#1565C0", "#6A1B9A", "#E65100", "#00838F", "#5D4037", "#AD1457"];
    return Object.fromEntries(
      speciesList.map((species, index) => [species, MAP_SPECIES_COLOR[species] || colors[index % colors.length]])
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

    Promise.all([
      fetchMapObservations(),
      fetchLocations(),
      fetchNearbyLocations(DEFAULT_CENTER[0], DEFAULT_CENTER[1], 10),
    ]).then(([nextObservations, nextLocations, nextNearbyLocations]) => {
      if (!isMounted) return;
      setObservations(nextObservations);
      setLocations(nextLocations);
      setNearbyLocations(nextNearbyLocations);
      setSelectedSpecies(Array.from(new Set(nextObservations.map((observation) => observation.species))));
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
    };
  }, []);

  useEffect(() => {
    const layer = markerLayer.current;
    if (!layer) return;

    layer.clearLayers();

    filteredMarkers.forEach((m) => {
      const color = speciesColor[m.species] || "#2E7D32";
      const detailsHref = `/map/observations/${m.id}`;
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(layer);

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:600">${escapeHtml(m.species)}</h3>
          <p style="margin:4px 0;font-size:12px;color:#888;font-weight:500">${escapeHtml(m.location)}</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.elevation}: ${m.elevation} m dpl</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.date}: ${escapeHtml(m.date)}</p>
          <p style="margin:0;font-size:11px;color:#666">${m.lat.toFixed(2)}°, ${m.lng.toFixed(2)}°</p>
          <a
            href="${escapeHtml(detailsHref)}"
            style="display:inline-flex;align-items:center;justify-content:center;margin-top:10px;border-radius:6px;background:#2E7D32;color:white;padding:7px 10px;font-size:12px;font-weight:600;text-decoration:none"
          >
            ${copy.viewDetails}
          </a>
        </div>
      `);
    });
  }, [copy.date, copy.elevation, copy.viewDetails, filteredMarkers, speciesColor]);

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
        <p className="mb-2 text-[10px] font-medium text-muted-foreground">
          {copy.locations}: {locations.length} · {copy.nearby}: {nearbyLocations.length}
        </p>
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
      
      {/* Species Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-background/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-border">
        <p className="text-xs font-bold mb-2 text-foreground">{copy.legend}</p>
        <div className="flex flex-col gap-1.5">
          {Object.entries(speciesColor).map(([species, color]) => (
            <div key={species} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full shrink-0" 
                style={{ backgroundColor: color }} 
              />
              <span className="text-[10px] font-medium text-foreground">{species}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
