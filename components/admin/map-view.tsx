"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import { AlertTriangle, Eye } from "lucide-react";
import L from "leaflet";
import { useEffect } from "react";
import type { Incident } from "@/types";
import { crimeTypes, statusTypes } from "@/constants/incident-types";

// Component to update map view when center changes
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

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

interface MapViewProps {
  filteredIncidents: Incident[];
  hotspots: { center: [number, number]; count: number; radius: number }[];
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  setSelectedIncident: (incident: Incident) => void;
}

export default function MapView({
  filteredIncidents,
  hotspots,
  mapCenter,
  setMapCenter,
  setSelectedIncident,
}: MapViewProps) {
  const [showHotspots, setShowHotspots] = useState(true);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Incident Map</CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Geographic view of all reported incidents</span>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-hotspots"
              checked={showHotspots}
              onCheckedChange={(checked) => setShowHotspots(!!checked)}
            />
            <Label
              htmlFor="show-hotspots"
              className="flex items-center gap-1 cursor-pointer"
            >
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Show Crime Hotspots
            </Label>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[600px] relative w-full">
          <div className="inset-0 absolute z-10">
            <MapContainer
              center={mapCenter}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
            >
              <ChangeMapView center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Render hotspots */}
              {showHotspots &&
                hotspots.map((hotspot, index) => (
                  <Circle
                    key={`hotspot-${index}`}
                    center={hotspot.center}
                    radius={hotspot.radius}
                    pathOptions={{
                      color: "red",
                      fillColor: "red",
                      fillOpacity: 0.2 + Math.min(hotspot.count, 10) / 20, // More incidents = more opaque
                      weight: 1,
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Crime Hotspot
                        </h3>
                        <p className="text-sm">
                          {hotspot.count} incidents reported in this area
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                ))}

              {/* Render incident markers */}
              {filteredIncidents.map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.latitude, incident.longitude]}
                  icon={getMarkerIcon(incident.type)}
                  eventHandlers={{
                    click: () => {
                      setMapCenter([incident.latitude, incident.longitude]);
                    },
                  }}
                >
                  <Popup>
                    <div className="w-64">
                      <h3 className="font-bold">{incident.title}</h3>
                      <div className="flex items-center gap-2 my-1">
                        <Badge variant="outline">
                          {crimeTypes.find((t) => t.id === incident.type)
                            ?.label || "Other"}
                        </Badge>
                        <Badge
                          variant={
                            incident.status === "resolved"
                              ? "default"
                              : "outline"
                          }
                          className={
                            incident.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : incident.status === "investigating"
                              ? "bg-blue-100 text-blue-800"
                              : incident.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {statusTypes.find((s) => s.id === incident.status)
                            ?.label || "Pending"}
                        </Badge>
                      </div>
                      {incident.imageUrl && (
                        <img
                          src={incident.imageUrl || "/placeholder.svg"}
                          alt={incident.title}
                          className="w-full h-32 object-cover rounded-md my-2"
                        />
                      )}
                      <p className="text-sm">{incident.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Reported on{" "}
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full flex items-center justify-center gap-1"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <Eye className="h-3 w-3" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
