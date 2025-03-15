"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { MapPin } from "lucide-react";
import L from "leaflet";
import type { Incident } from "@/types";
import { crimeTypes, statusTypes } from "@/constants/incident-types";

// Custom marker icon based on crime type
function getMarkerIcon(type: string) {
  const crimeType = crimeTypes.find((t) => t.id === type) || crimeTypes[4]; // Default to "other"

  return L.divIcon({
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="background-color: ${crimeType.color};" class="marker-pin"></div>`,
  });
}

interface IncidentDetailProps {
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;
  updateIncidentStatus: (id: string, status: string) => void;
  deleteIncident: (id: string) => void;
}

export default function IncidentDetail({
  selectedIncident,
  setSelectedIncident,
  updateIncidentStatus,
  deleteIncident,
}: IncidentDetailProps) {
  if (!selectedIncident) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg p-6 overflow-y-auto z-50">
      <div className="sticky top-0 bg-background pt-2 pb-4 flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Incident Details</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedIncident(null)}
          className="ml-2"
        >
          Close
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{selectedIncident.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {crimeTypes.find((t) => t.id === selectedIncident.type)?.label ||
                "Other"}
            </Badge>
            <Badge
              variant={
                selectedIncident.status === "resolved" ? "default" : "outline"
              }
              className={
                selectedIncident.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : selectedIncident.status === "investigating"
                  ? "bg-blue-100 text-blue-800"
                  : selectedIncident.status === "resolved"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {statusTypes.find((s) => s.id === selectedIncident.status)
                ?.label || "Pending"}
            </Badge>
          </div>
        </div>

        {selectedIncident.imageUrl && (
          <div>
            <img
              src={selectedIncident.imageUrl || "/placeholder.svg"}
              alt={selectedIncident.title}
              className="w-full h-48 object-cover rounded-md"
            />
          </div>
        )}

        <div>
          <h4 className="font-medium mb-1">Description</h4>
          <p className="text-sm">{selectedIncident.description}</p>
        </div>

        <div>
          <h4 className="font-medium mb-1">Location</h4>
          <p className="text-sm flex items-start">
            <MapPin className="h-4 w-4 mr-1 mt-0.5 shrink-0" />
            <span>{selectedIncident.address || "Unknown location"}</span>
          </p>
          <div className="mt-2 h-40 rounded-md overflow-hidden border">
            <MapContainer
              center={[selectedIncident.latitude, selectedIncident.longitude]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[
                  selectedIncident.latitude,
                  selectedIncident.longitude,
                ]}
                icon={getMarkerIcon(selectedIncident.type)}
              />
            </MapContainer>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-1">Reported By</h4>
          <p className="text-sm">
            {selectedIncident.user?.name || "Anonymous"}
          </p>
          <p className="text-xs text-muted-foreground">
            on {new Date(selectedIncident.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Update Status</h4>
          <Select
            value={selectedIncident.status}
            onValueChange={(value) =>
              updateIncidentStatus(selectedIncident.id, value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusTypes.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end mt-4">
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this incident?")) {
                  deleteIncident(selectedIncident.id);
                }
              }}
            >
              Delete Incident
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
