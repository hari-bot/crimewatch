"use client";

import { useMapEvents } from "react-leaflet";
import { Marker } from "react-leaflet";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  position: [number, number] | null;
  setPosition: (position: [number, number] | null) => void;
}

export default function LocationPicker({
  onLocationSelect,
  position,
  setPosition,
}: LocationPickerProps) {
  const map = useMapEvents({
    click(e: any) {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}
