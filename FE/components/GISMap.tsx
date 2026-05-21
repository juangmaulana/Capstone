import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";

const MOCK_MARKERS = [
  { lat: -7.838, lng: 114.375, elevation: 78, species: "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.", location: "Savana Bekol, Baluran", date: "2025-12-15", source: "Field Survey", confidence: 96 },
  { lat: -7.842, lng: 114.391, elevation: 14, species: "Lantana camara L.", location: "Pantai Bama, Baluran", date: "2025-11-20", source: "GBIF Import", confidence: 88 },
  { lat: -7.815, lng: 114.368, elevation: 247, species: "Merremia hederacea (Burm.f.) Hallier f.", location: "Gunung Baluran, Baluran", date: "2026-01-05", source: "Citizen Science", confidence: 78 },
  { lat: -7.855, lng: 114.410, elevation: 22, species: "Clitoria ternatea L.", location: "Hutan Tropis, Baluran", date: "2026-02-10", source: "Remote Sensing", confidence: 95 },
  { lat: -7.820, lng: 114.385, elevation: 61, species: "Ageratum conyzoides L.", location: "Pos Sumber Batang, Baluran", date: "2026-01-28", source: "Field Survey", confidence: 75 },
  { lat: -7.805, lng: 114.355, elevation: 132, species: "Lantana camara L.", location: "Savana Bekol, Baluran", date: "2025-10-14", source: "GBIF Import", confidence: 91 },
  { lat: -7.840, lng: 114.360, elevation: 214, species: "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.", location: "Gunung Baluran, Baluran", date: "2025-09-03", source: "Field Survey", confidence: 92 },
  { lat: -7.845, lng: 114.395, elevation: 33, species: "Clitoria ternatea L.", location: "Kawasan Bama, Baluran", date: "2026-02-20", source: "Citizen Science", confidence: 84 },
];

const speciesColor: Record<string, string> = {
  "Vachellia nilotica (L.) P.J.H.Hurter & Mabb.": "#2E7D32",
  "Lantana camara L.": "#1565C0",
  "Merremia hederacea (Burm.f.) Hallier f.": "#6A1B9A",
  "Clitoria ternatea L.": "#E65100",
  "Ageratum conyzoides L.": "#00838F",
};

const MAP_COPY = {
  en: {
    legend: "Species Legend",
    date: "Date",
    elevation: "Elevation",
  },
  id: {
    legend: "Legenda Spesies",
    date: "Tanggal",
    elevation: "Elevasi",
  },
} as const;

export function GISMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const { language } = useLanguage();
  const copy = MAP_COPY[language];

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
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.elevation}: ${m.elevation} m dpl</p>
          <p style="margin:4px 0;font-size:12px;color:#888">${copy.date}: ${m.date}</p>
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
  }, [copy.date]);

  return (
    <div className="relative isolate h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      
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
