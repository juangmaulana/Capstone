import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { MAP_OBSERVATIONS, MAP_SPECIES_COLOR, MAP_SPECIES_LIST } from "@/lib/map-observations";

const MAP_COPY = {
  en: {
    legend: "Species Legend",
    filter: "Plant Filter",
    allPlants: "All plants",
    showing: "Showing",
    date: "Date",
    elevation: "Elevation",
    viewDetails: "View details",
  },
  id: {
    legend: "Legenda Spesies",
    filter: "Filter Tanaman",
    allPlants: "Semua tanaman",
    showing: "Menampilkan",
    date: "Tanggal",
    elevation: "Elevasi",
    viewDetails: "Lihat detail",
  },
} as const;

export function GISMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(MAP_SPECIES_LIST);
  const { language } = useLanguage();
  const copy = MAP_COPY[language];
  const selectedSpeciesSet = useMemo(() => new Set(selectedSpecies), [selectedSpecies]);
  const filteredMarkers = useMemo(
    () => MAP_OBSERVATIONS.filter((marker) => selectedSpeciesSet.has(marker.species)),
    [selectedSpeciesSet],
  );
  const allSelected = selectedSpecies.length === MAP_SPECIES_LIST.length;

  const toggleAllSpecies = () => {
    setSelectedSpecies((current) => current.length === MAP_SPECIES_LIST.length ? [] : MAP_SPECIES_LIST);
  };

  const toggleSpecies = (species: string) => {
    setSelectedSpecies((current) =>
      current.includes(species)
        ? current.filter((item) => item !== species)
        : [...current, species],
    );
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-7.833, 114.366],
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
      const color = MAP_SPECIES_COLOR[m.species] || "#2E7D32";
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
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:600">${m.species}</h3>
          <p style="margin:4px 0;font-size:12px;color:#888;font-weight:500">${m.location}</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.elevation}: ${m.elevation} m dpl</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.date}: ${m.date}</p>
          <p style="margin:0;font-size:11px;color:#666">${m.lat.toFixed(2)}°, ${m.lng.toFixed(2)}°</p>
          <a
            href="${detailsHref}"
            style="display:inline-flex;align-items:center;justify-content:center;margin-top:10px;border-radius:6px;background:#2E7D32;color:white;padding:7px 10px;font-size:12px;font-weight:600;text-decoration:none"
          >
            ${copy.viewDetails}
          </a>
        </div>
      `);
    });
  }, [copy.date, copy.elevation, copy.viewDetails, filteredMarkers]);

  return (
    <div className="relative isolate h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />

      {/* Plant Filter */}
      <div className="absolute left-6 top-6 z-[1000] max-w-[300px] rounded-lg border border-border bg-background/90 p-3 shadow-lg backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-foreground">{copy.filter}</p>
          <span className="text-[10px] font-medium text-muted-foreground">
            {copy.showing} {filteredMarkers.length}/{MAP_OBSERVATIONS.length}
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
          {MAP_SPECIES_LIST.map((species) => (
            <label key={species} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
              <input
                type="checkbox"
                checked={selectedSpeciesSet.has(species)}
                onChange={() => toggleSpecies(species)}
                className="h-3.5 w-3.5 accent-primary"
              />
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: MAP_SPECIES_COLOR[species] }}
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
          {Object.entries(MAP_SPECIES_COLOR).map(([species, color]) => (
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
