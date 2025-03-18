"use client";

import { Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar } from "lucide-react";
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
  const crimeType =
    crimeTypes.find((t) => t.id === incident.type) || crimeTypes[4];

  // Create marker icon based on crime type
  const markerIcon = L.divIcon({
    className: `custom-div-icon ${isSelected ? "selected-marker" : ""}`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="background-color: ${
      crimeType.color
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
      <Popup className="incident-popup">
        <div className="p-2 w-64">
          <h3 className="font-bold text-sm mb-1">{incident.title}</h3>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {incident.description}
          </p>

          <div className="flex items-center justify-between mb-2">
            <Badge
              variant="outline"
              style={{
                backgroundColor: `${crimeType.color}20`,
                color: crimeType.color,
                borderColor: `${crimeType.color}40`,
              }}
            >
              {crimeType.label}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(incident.createdAt).toLocaleDateString()}
            </div>
          </div>

          {incident.imageUrl && (
            <div className="w-full h-24 rounded-md overflow-hidden mb-2">
              <img
                src={incident.imageUrl || "/placeholder.svg"}
                alt={incident.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

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
      </Popup>
    </Marker>
  );
}
