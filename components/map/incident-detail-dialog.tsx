"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, User, AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import type { Incident } from "@/types";
import { crimeTypes, statusTypes } from "@/constants/crime-types";

interface IncidentDetailDialogProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IncidentDetailDialog({
  incident,
  open,
  onOpenChange,
}: IncidentDetailDialogProps) {
  if (!incident) {
    return null;
  }

  const crimeType =
    crimeTypes.find((t) => t.id === incident.type) || crimeTypes[4];
  const status =
    statusTypes.find((s) => s.id === incident.status) || statusTypes[0];

  // Custom marker icon based on crime type
  const markerIcon = L.divIcon({
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="background-color: ${crimeType.color};" class="marker-pin"></div>`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {incident.imageUrl && (
          <div className="w-full h-48 relative">
            <img
              src={incident.imageUrl || "/placeholder.svg"}
              alt={incident.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)`,
              }}
            ></div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <Badge
                style={{
                  backgroundColor: crimeType.color,
                  color: "white",
                }}
                className="mb-2"
              >
                {crimeType.label}
              </Badge>
              <h2 className="text-white text-xl font-bold">{incident.title}</h2>
            </div>
          </div>
        )}

        <div className="p-6">
          {!incident.imageUrl && (
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  style={{
                    backgroundColor: crimeType.color,
                    color: "white",
                  }}
                >
                  {crimeType.label}
                </Badge>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${status.color}20`,
                    color: status.color,
                    borderColor: `${status.color}40`,
                  }}
                >
                  {status.label}
                </Badge>
              </div>
              <DialogTitle className="text-xl">{incident.title}</DialogTitle>
            </DialogHeader>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Description</h3>
              <p className="text-sm text-muted-foreground">
                {incident.description}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm">
                  {incident.address || "Unknown location"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Reported on {new Date(incident.createdAt).toLocaleString()}
                </span>
              </div>
              {incident.user && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Reported by {incident.user.name}
                  </span>
                </div>
              )}
            </div>

            <div className="h-40 rounded-md overflow-hidden border">
              <MapContainer
                center={[incident.latitude, incident.longitude]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                  position={[incident.latitude, incident.longitude]}
                  icon={markerIcon}
                />
              </MapContainer>
            </div>

            {status.id === "pending" && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">
                    Pending Investigation
                  </h4>
                  <p className="text-xs text-amber-700">
                    This incident has been reported and is awaiting review by
                    authorities.
                  </p>
                </div>
              </div>
            )}

            {status.id === "investigating" && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Under Investigation
                  </h4>
                  <p className="text-xs text-blue-700">
                    Authorities are currently investigating this incident.
                  </p>
                </div>
              </div>
            )}

            {status.id === "resolved" && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">
                    Resolved
                  </h4>
                  <p className="text-xs text-green-700">
                    This incident has been resolved by the authorities.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
