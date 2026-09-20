import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "./ui/index.jsx";

const DEFAULT_CENTER = [20.5937, 78.9629]; // Geographic center of India — used only until a location is set.

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#4f46e5"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

/**
 * Interactive OpenStreetMap picker (no API key needed). Click the map or drag the
 * pin to set a location; `onChange(latitude, longitude)` fires either way, and also
 * when "Use current location" resolves via the browser's Geolocation API.
 */
export default function LocationPicker({ latitude, longitude, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
    const map = L.map(containerRef.current, {
      center: hasCoords ? [latitude, longitude] : DEFAULT_CENTER,
      zoom: hasCoords ? 15 : 5,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e) => onChangeRef.current(e.latlng.lat, e.latlng.lng));

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // Map is created once; later coordinate updates are synced by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker + map view in sync whenever the coordinates change, from any source
  // (a map click, a marker drag, or "Use current location").
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    if (!markerRef.current) {
      const marker = L.marker([latitude, longitude], { icon: pinIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        onChangeRef.current(lat, lng);
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
    }

    map.setView([latitude, longitude], Math.max(map.getZoom(), 15));
  }, [latitude, longitude]);

  function useCurrentLocation() {
    if (!navigator.geolocation) { setMapError("Geolocation isn't supported by this browser."); return; }
    setLocating(true); setMapError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { onChangeRef.current(pos.coords.latitude, pos.coords.longitude); setLocating(false); },
      (err) => { setMapError(err.message || "Unable to get your location."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  return (
    <div>
      <div ref={containerRef} className="h-64 w-full rounded-lg overflow-hidden border border-slate-200" />
      {mapError && <p className="text-xs text-red-600 mt-2">{mapError}</p>}
      <div className="flex items-center justify-between mt-3 gap-3">
        <p className="text-xs text-slate-500">
          {hasCoords ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : "Tap the map to set your shop's location"}
        </p>
        <Button type="button" variant="secondary" size="sm" loading={locating} onClick={useCurrentLocation}>
          Use current location
        </Button>
      </div>
    </div>
  );
}
