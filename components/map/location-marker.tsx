"use client";

import { useState, useEffect } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

export default function LocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", (e) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position === null ? null : (
    <Marker
      position={position}
      icon={L.divIcon({
        className: "current-location-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `
          <div class="relative w-6 h-6">
            <div class="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
            <div class="absolute inset-1 bg-blue-500 rounded-full"></div>
            <div class="absolute inset-2 bg-white rounded-full"></div>
            <div class="absolute inset-3 bg-blue-500 rounded-full"></div>
          </div>
        `,
      })}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-medium text-sm">Your Location</h3>
          <p className="text-xs text-muted-foreground">
            Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
