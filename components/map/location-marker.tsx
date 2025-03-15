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
        className: "bg-primary rounded-full border-4 border-white",
        iconSize: [24, 24],
        html: `<div class="relative w-6 h-6">
                <div class="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                <div class="absolute inset-0 bg-blue-500 rounded-full"></div>
              </div>`,
      })}
    >
      <Popup>You are here</Popup>
    </Marker>
  );
}
