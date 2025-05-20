"use client";

import { useState, useEffect } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

interface LocationMarkerProps {
  position?: [number, number] | null;
  setPosition?: (position: [number, number] | null) => void;
}

export default function LocationMarker({ position: externalPosition, setPosition: setExternalPosition }: LocationMarkerProps = {}) {
  const [localPosition, setLocalPosition] = useState<[number, number] | null>(null);
  const map = useMap();
  
  // Use either the external position state or the local position state
  const position = externalPosition !== undefined ? externalPosition : localPosition;
  const setPosition = setExternalPosition || setLocalPosition;
    // We don't need map click events here as they are handled by LocationPicker

  // Only use locate if we don't have an external position already set
  useEffect(() => {
    if (!externalPosition) {
      map.locate().on("locationfound", (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
        map.flyTo(e.latlng, map.getZoom());
      });
    }
  }, [map, externalPosition, setPosition]);
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
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPosition: [number, number] = [marker.getLatLng().lat, marker.getLatLng().lng];
          setPosition(newPosition);
        },
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-medium text-sm">Selected Location</h3>
          <p className="text-xs text-muted-foreground">
            Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
