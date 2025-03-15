"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface ChangeMapViewProps {
  center: [number, number];
}

export default function ChangeMapView({ center }: ChangeMapViewProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 13); // Ensuring map moves to the searched location
  }, [center, map]);

  return null;
}
