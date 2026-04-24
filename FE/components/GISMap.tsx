import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MOCK_MARKERS = [
  { lat: -7.838, lng: 114.375, species: "Acacia nilotica", location: "Savana Bekol, Baluran", risk: "Critical", date: "2025-12-15", source: "Field Survey", confidence: 96 },
  { lat: -7.842, lng: 114.391, species: "Lantana camara", location: "Pantai Bama, Baluran", risk: "High", date: "2025-11-20", source: "GBIF Import", confidence: 88 },
  { lat: -7.815, lng: 114.368, species: "Mikania micrantha", location: "Gunung Baluran, Baluran", risk: "Medium", date: "2026-01-05", source: "Citizen Science", confidence: 78 },
  { lat: -7.855, lng: 114.410, species: "Chromolaena odorata", location: "Hutan Tropis, Baluran", risk: "High", date: "2026-02-10", source: "Remote Sensing", confidence: 95 },
  { lat: -7.820, lng: 114.385, species: "Ageratum conyzoides", location: "Pos Sumber Batang, Baluran", risk: "Low", date: "2026-01-28", source: "Field Survey", confidence: 75 },
  { lat: -7.805, lng: 114.355, species: "Lantana camara", location: "Savana Bekol, Baluran", risk: "Critical", date: "2025-10-14", source: "GBIF Import", confidence: 91 },
  { lat: -7.840, lng: 114.360, species: "Acacia nilotica", location: "Gunung Baluran, Baluran", risk: "High", date: "2025-09-03", source: "Field Survey", confidence: 92 },
  { lat: -7.845, lng: 114.395, species: "Chromolaena odorata", location: "Kawasan Bama, Baluran", risk: "Medium", date: "2026-02-20", source: "Citizen Science", confidence: 84 },
];

const riskColor: Record<string, string> = {
  Critical: "#C62828",
  High: "#E65100",
  Medium: "#F9A825",
  Low: "#2E7D32",
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
      const color = riskColor[m.risk] || "#2E7D32";
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
          <div style="display:flex;gap:8px;margin-bottom:4px">
            <span style="background:${color}20;color:${color};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500">${m.risk} Risk</span>
          </div>
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
    </div>
  );
}
