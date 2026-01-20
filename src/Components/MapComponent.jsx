import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet icon paths
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function MapComponent({ onMapClick, sidebarOpen }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    // Initialize map (center North America)
    mapRef.current = L.map(mapContainerRef.current).setView(
      [39.8283, -98.5795],
      4
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);

    mapRef.current.on("click", (e) => {
        const { lat, lng } = e.latlng;
        
        if (markerRef.current) {
            mapRef.current.removeLayer(markerRef.current);
        }
        
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        markerRef.current
          .bindPopup(
            `<b>Coordinates</b><br/>Lat: ${lat.toFixed(3)}<br/>Lon: ${lng.toFixed(3)}<hr/><em>Loading…</em>`
          )
          .openPopup();

        onMapClick(lat, lng, markerRef.current);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
      if (mapRef.current) {
          setTimeout(() => {
              mapRef.current.invalidateSize();
          }, 220);
      }
  }, [sidebarOpen]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ height: "100%", width: "100%" }}
    />
  );
}
