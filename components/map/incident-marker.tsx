"use client";

import { Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import L from "leaflet";
import type { Incident } from "@/types";
import { crimeTypes } from "@/constants/crime-types";

interface IncidentMarkerProps {
  incident: Incident;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onViewDetails: (incident: Incident) => void;
}

export default function IncidentMarker({
  incident,
  isSelected,
  onSelect,
  onViewDetails,
}: IncidentMarkerProps) {
  // Create marker icon based on crime type
  const markerIcon = L.divIcon({
    className: `custom-div-icon ${isSelected ? "selected-marker" : ""}`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="background-color: ${
      crimeTypes.find((t) => t.id === incident.type)?.color || "#581845"
    };" class="marker-pin ${isSelected ? "selected-marker-pin" : ""}"></div>`,
  });

  return (
    <Marker
      position={[incident.latitude, incident.longitude]}
      icon={markerIcon}
      eventHandlers={{
        click: () => {
          onSelect(incident.id);
        },
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold">{incident.title}</h3>
          <p className="text-sm">{incident.address || "Unknown Location"}</p>
          <Badge variant="outline" className="mt-2">
            {crimeTypes.find((t) => t.id === incident.type)?.label || "Other"}
          </Badge>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(incident);
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
