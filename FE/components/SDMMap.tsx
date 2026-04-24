import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SDMMapProps {
  species: string;
  year: string;
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

    // Simulate different distribution severity based on year.
    // Farther years = more circles/area covered.
    const yearNum = parseInt(year);
    const severityFactor = Math.max(1, (yearNum - 2025) / 5); // increases over time
    
    // Base center of distribution
    const centers = [
      { lat: -7.838, lng: 114.375 },
      { lat: -7.815, lng: 114.368 },
      { lat: -7.855, lng: 114.410 },
      { lat: -7.820, lng: 114.385 },
      { lat: -7.805, lng: 114.355 },
    ];
    
    // Pick a specific color based on species roughly
    const isCritical = species.includes("lantana") || species.includes("acacia");
    const baseColor = isCritical ? "#C62828" : "#E65100"; // Red or Orange hue

    // Generate random points around the centers to simulate distribution
    const numPoints = Math.min(200, 10 + Math.floor(severityFactor * 15));
    
    for (let i = 0; i < numPoints; i++) {
       const center = centers[i % centers.length];
       // spread increases with year
       const latOffset = (Math.random() - 0.5) * 0.05 * (severityFactor * 0.5);
       const lngOffset = (Math.random() - 0.5) * 0.05 * (severityFactor * 0.5);
       
       L.circleMarker([center.lat + latOffset, center.lng + lngOffset], {
        radius: 12 + (Math.random() * 8), // slightly fuzzy blobs
        fillColor: baseColor,
        color: baseColor,
        weight: 0,
        opacity: 0,
        fillOpacity: 0.15, // stack them for heatmap effect
      }).addTo(map);
    }

  }, [species, year]);

  return (
    <div className="relative isolate h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
    </div>
  );
}
