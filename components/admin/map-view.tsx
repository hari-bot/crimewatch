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
import { getRiskLevelColor } from "@/utils/admin-dashboard-utils";
import HotspotSidebar from "./hotspot-sidebar";

// Component to update map view when center changes
function ChangeMapView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, map, zoom]);
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
  hotspots: {
    center: [number, number];
    count: number;
    radius: number;
    incidents: Incident[];
    incidentsByType?: Record<string, number>;
    riskLevel?: string;
  }[];
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  setSelectedIncident: (incident: Incident) => void;
  allIncidents?: Incident[];
}

export default function MapView({
  filteredIncidents,
  hotspots,
  mapCenter,
  setMapCenter,
  setSelectedIncident,
}: MapViewProps) {
  const [showHotspots, setShowHotspots] = useState(true);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);

  const handleHotspotSelect = (center: [number, number], zoom?: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  return (
    <div className="flex h-[600px]">
      {/* Hotspot Sidebar */}
      {showHotspots && hotspots.length > 0 && (
        <HotspotSidebar
          hotspots={hotspots}
          onHotspotSelect={handleHotspotSelect}
          onIncidentSelect={setSelectedIncident}
        />
      )}

      <div className="flex-1">
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
                  <ChangeMapView center={mapCenter} zoom={mapZoom} />
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
                          color: getRiskLevelColor(
                            hotspot.riskLevel || "MEDIUM"
                          ),
                          fillColor: getRiskLevelColor(
                            hotspot.riskLevel || "MEDIUM"
                          ),
                          fillOpacity: 0.2 + Math.min(hotspot.count, 10) / 20, // More incidents = more opaque
                          weight: 2,
                        }}
                        eventHandlers={{
                          click: () => {
                            // Center map on hotspot when clicked
                            setMapCenter(hotspot.center);
                          },
                        }}
                      >
                        <Popup maxWidth={300} minWidth={250}>
                          <div className="p-3">
                            <h3 className="font-bold text-lg flex items-center gap-1 mb-2">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              Crime Hotspot ({hotspot.count} incidents)
                            </h3>
                            <p className="text-sm mb-3">
                              This area has a higher concentration of reported
                              crimes.
                            </p>

                            <div className="mb-3">
                              <h4 className="font-semibold mb-1">Risk Level</h4>
                              <div
                                className="px-3 py-1 rounded-md text-white font-bold inline-block"
                                style={{
                                  backgroundColor: getRiskLevelColor(
                                    hotspot.riskLevel || "MEDIUM"
                                  ),
                                }}
                              >
                                {hotspot.riskLevel || "MEDIUM"}
                              </div>
                            </div>

                            <div className="mb-3">
                              <h4 className="font-semibold mb-1">
                                Incident Types
                              </h4>
                              <div className="space-y-1">
                                {hotspot.incidentsByType &&
                                  Object.entries(hotspot.incidentsByType).map(
                                    ([type, count]) => (
                                      <div
                                        key={type}
                                        className="flex justify-between items-center"
                                      >
                                        <span className="flex items-center">
                                          <span
                                            className="w-3 h-3 rounded-full mr-1.5"
                                            style={{
                                              backgroundColor:
                                                crimeTypes.find(
                                                  (t) => t.id === type
                                                )?.color || "#581845",
                                            }}
                                          ></span>
                                          {crimeTypes.find((t) => t.id === type)
                                            ?.label || "Other"}
                                          :
                                        </span>
                                        <span className="font-medium">
                                          {count}
                                        </span>
                                      </div>
                                    )
                                  )}
                              </div>
                            </div>
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
      </div>
    </div>
  );
}
