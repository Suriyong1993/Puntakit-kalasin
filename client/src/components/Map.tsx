/**
 * LEAFLET + OPENSTREETMAP MAP WRAPPER
 *
 * Renders a map with no API key, no billing, and no external script load —
 * Leaflet initializes synchronously against the DOM, and tiles are plain
 * <img> requests to the OSM tile server. Swapping to a different tile
 * provider later (CartoDB, MapTiler, ...) is a one-line change to
 * TILE_LAYER_URL below; nothing else in this file or its callers changes.
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 * const mapRef = useRef<L.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 16.4322, lng: 103.5061 }}
 *   initialZoom={12}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Leaflet itself owns re-rendering, not React state.
 *   }}
 * />
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
const TILE_LAYER_MAX_ZOOM = 19;

interface MapViewProps {
  className?: string;
  initialCenter?: L.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 16.4322, lng: 103.5061 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  const init = usePersistFn(() => {
    if (!mapContainer.current || map.current) return;

    const instance = L.map(mapContainer.current, {
      center: initialCenter,
      zoom: initialZoom,
    });
    L.tileLayer(TILE_LAYER_URL, {
      maxZoom: TILE_LAYER_MAX_ZOOM,
      attribution: TILE_LAYER_ATTRIBUTION,
    }).addTo(instance);

    map.current = instance;
    onMapReady?.(instance);
  });

  useEffect(() => {
    init();
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [init]);

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
