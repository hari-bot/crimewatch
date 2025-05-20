"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface ChangeMapViewProps {
  center: [number, number];
}

export default function ChangeMapView({ center }: ChangeMapViewProps) {
  const map = useMap();

  useEffect(() => {
    // Use setView instead of flyTo for a smoother experience
    map.setView(center, map.getZoom() || 13);
  }, [center, map]);

  return null;
}
