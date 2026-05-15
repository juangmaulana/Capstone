import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MOCK_MARKERS = [
  { lat: -7.838, lng: 114.375, species: "Vachellia nilotica", location: "Savana Bekol, Baluran", date: "2025-12-15", source: "Field Survey", confidence: 96 },
  { lat: -7.842, lng: 114.391, species: "Lantana camara", location: "Pantai Bama, Baluran", date: "2025-11-20", source: "GBIF Import", confidence: 88 },
  { lat: -7.815, lng: 114.368, species: "Merremia hederacea", location: "Gunung Baluran, Baluran", date: "2026-01-05", source: "Citizen Science", confidence: 78 },
  { lat: -7.855, lng: 114.410, species: "Clitoria ternatea", location: "Hutan Tropis, Baluran", date: "2026-02-10", source: "Remote Sensing", confidence: 95 },
  { lat: -7.820, lng: 114.385, species: "Ageratum conyzoides", location: "Pos Sumber Batang, Baluran", date: "2026-01-28", source: "Field Survey", confidence: 75 },
  { lat: -7.805, lng: 114.355, species: "Lantana camara", location: "Savana Bekol, Baluran", date: "2025-10-14", source: "GBIF Import", confidence: 91 },
  { lat: -7.840, lng: 114.360, species: "Vachellia nilotica", location: "Gunung Baluran, Baluran", date: "2025-09-03", source: "Field Survey", confidence: 92 },
  { lat: -7.845, lng: 114.395, species: "Clitoria ternatea", location: "Kawasan Bama, Baluran", date: "2026-02-20", source: "Citizen Science", confidence: 84 },
];

const speciesColor: Record<string, string> = {
  "Vachellia nilotica": "#2E7D32",
  "Lantana camara": "#1565C0",
  "Merremia hederacea": "#6A1B9A",
  "Clitoria ternatea": "#E65100",
  "Ageratum conyzoides": "#00838F",
};

export function GISMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

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

    MOCK_MARKERS.forEach((m) => {
      const color = speciesColor[m.species] || "#2E7D32";
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:600">${m.species}</h3>
          <p style="margin:4px 0;font-size:12px;color:#888;font-weight:500">${m.location}</p>
          <p style="margin:4px 0;font-size:12px;color:#888">Date: ${m.date}</p>
          <p style="margin:0;font-size:11px;color:#666">${m.lat.toFixed(2)}°, ${m.lng.toFixed(2)}°</p>
        </div>
      `);
    });

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
    };
  }, []);

  return (
    <div className="relative isolate h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      
      {/* Species Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-background/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-border">
        <p className="text-xs font-bold mb-2 text-foreground">Legenda Spesies</p>
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
