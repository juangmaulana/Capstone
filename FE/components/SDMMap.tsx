import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SDMMapProps {
  species: string;
  year: string;
}

// IUCN-based suitability risk zones with their colors
const SUITABILITY_ZONES = {
  critical: { color: "#C62828", label: "Critical Risk" },
  high: { color: "#E65100", label: "High Risk" },
  medium: { color: "#F9A825", label: "Medium Risk" },
  low: { color: "#2E7D32", label: "Low Risk" },
};

// Seed-based pseudo-random for consistent results per species+year
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function SDMMap({ species, year }: SDMMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-7.833, 114.366], // Baluran National Park
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Using satellite-style tiles or similar if available, but stick to standard OSM for reliability
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;
    
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

  // Update map layer when species or year changes
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // Clear existing layers except the tile layer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const yearNum = parseInt(year);
    const severityFactor = Math.max(1, (yearNum - 2025) / 10);
    
    // Base centers of distribution zones
    const zoneCenters = [
      // Critical risk zones — core invasion centers
      { lat: -7.838, lng: 114.375, zone: "critical" as const },
      { lat: -7.805, lng: 114.355, zone: "critical" as const },
      // High risk zones — surrounding areas
      { lat: -7.842, lng: 114.391, zone: "high" as const },
      { lat: -7.840, lng: 114.360, zone: "high" as const },
      { lat: -7.855, lng: 114.410, zone: "high" as const },
      // Medium risk zones — transition areas
      { lat: -7.815, lng: 114.368, zone: "medium" as const },
      { lat: -7.845, lng: 114.395, zone: "medium" as const },
      { lat: -7.825, lng: 114.405, zone: "medium" as const },
      // Low risk zones — peripheral areas
      { lat: -7.820, lng: 114.385, zone: "low" as const },
      { lat: -7.810, lng: 114.415, zone: "low" as const },
      { lat: -7.860, lng: 114.370, zone: "low" as const },
    ];

    const seed = hashCode(`${species}-${year}`);
    const rng = seededRandom(seed);

    // Zone-specific configuration for point density and spread
    const zoneConfig = {
      critical: { points: Math.min(60, 8 + Math.floor(severityFactor * 8)), spread: 0.015, radius: 16, opacity: 0.20 },
      high: { points: Math.min(50, 6 + Math.floor(severityFactor * 6)), spread: 0.020, radius: 14, opacity: 0.16 },
      medium: { points: Math.min(40, 5 + Math.floor(severityFactor * 5)), spread: 0.025, radius: 12, opacity: 0.13 },
      low: { points: Math.min(30, 4 + Math.floor(severityFactor * 4)), spread: 0.030, radius: 10, opacity: 0.10 },
    };

    // Generate suitability heatmap zones
    zoneCenters.forEach((center) => {
      const config = zoneConfig[center.zone];
      const { color } = SUITABILITY_ZONES[center.zone];

      for (let i = 0; i < config.points; i++) {
        const latOffset = (rng() - 0.5) * config.spread * severityFactor * 0.5;
        const lngOffset = (rng() - 0.5) * config.spread * severityFactor * 0.5;

        L.circleMarker([center.lat + latOffset, center.lng + lngOffset], {
          radius: config.radius + (rng() * 6),
          fillColor: color,
          color: color,
          weight: 0,
          opacity: 0,
          fillOpacity: config.opacity,
        }).addTo(map);
      }
    });

  }, [species, year]);

  return (
    <div className="relative isolate h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
    </div>
  );
}
