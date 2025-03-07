"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import type { Incident } from "@/types";
import { useSession } from "next-auth/react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Search, Eye } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import MapController from "@/components/map-controller";
import IncidentDetailDialog from "./incident-detail-dialouge";

// Custom marker icon
import L from "leaflet";

// Define crime types with their respective colors
const crimeTypes = [
  { id: "theft", label: "Theft", color: "#FF5733" },
  { id: "assault", label: "Assault", color: "#C70039" },
  { id: "vandalism", label: "Vandalism", color: "#FFC300" },
  { id: "burglary", label: "Burglary", color: "#900C3F" },
  { id: "other", label: "Other", color: "#581845" },
];

// Component to recenter map based on user location
function LocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", (e) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position === null ? null : (
    <Marker
      position={position}
      icon={L.divIcon({
        className: "bg-primary rounded-full border-4 border-white",
        iconSize: [24, 24],
        html: `<div class="relative w-6 h-6">
                <div class="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                <div class="absolute inset-0 bg-blue-500 rounded-full"></div>
              </div>`,
      })}
    >
      <Popup>You are here</Popup>
    </Marker>
  );
}

export default function MapView() {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [radius, setRadius] = useState(2000);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    crimeTypes.map((type) => type.id)
  );
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    35.5951, -80.8104,
  ]); // Default center
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedIncidentData, setSelectedIncidentData] =
    useState<Incident | null>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          fetchIncidents(
            position.coords.latitude,
            position.coords.longitude,
            radius
          );
        },
        () => {
          // If location access is denied, use default location and fetch incidents
          fetchIncidents(mapCenter[0], mapCenter[1], radius);
        }
      );
    } else {
      // Fallback for browsers that don't support geolocation
      fetchIncidents(mapCenter[0], mapCenter[1], radius);
    }
  }, [radius, mapCenter[0], mapCenter[1]]);

  const fetchIncidents = async (lat: number, lng: number, radius: number) => {
    setLoading(true);
    try {
      // Fetch nearby incidents based on radius
      const nearbyResponse = await fetch(
        `/api/incidents?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      const nearbyData = await nearbyResponse.json();
      setIncidents(nearbyData);

      // Fetch all incidents for the map
      const allResponse = await fetch(`/api/incidents/all`);
      const allData = await allResponse.json();
      setAllIncidents(allData);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  const filteredIncidents = incidents.filter((incident) =>
    selectedTypes.includes(incident.type)
  );

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident.id);
    setSelectedIncidentData(incident);
    setDetailDialogOpen(true);

    // Fly to the incident location
    const map = document.querySelector(".leaflet-container")?._leaflet_map;
    if (map) {
      map.flyTo([incident.latitude, incident.longitude], 15);
    }
  };

  const handleCardClick = (incident: Incident) => {
    setSelectedIncident(incident.id);

    // Fly to the incident location without opening the dialog
    const map = document.querySelector(".leaflet-container")?._leaflet_map;
    if (map) {
      map.flyTo([incident.latitude, incident.longitude], 15);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-background border-r p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">CrimeWatch</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const searchInput = e.currentTarget.querySelector("input")?.value;
              if (searchInput) {
                // Use OpenStreetMap Nominatim for geocoding
                fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchInput
                  )}`
                )
                  .then((res) => res.json())
                  .then((data) => {
                    if (data && data.length > 0) {
                      const { lat, lon } = data[0];
                      setMapCenter([
                        Number.parseFloat(lat),
                        Number.parseFloat(lon),
                      ]);
                      fetchIncidents(
                        Number.parseFloat(lat),
                        Number.parseFloat(lon),
                        radius
                      );
                    }
                  })
                  .catch((err) =>
                    console.error("Error searching location:", err)
                  );
              }
            }}
          >
            <Input placeholder="Search location..." className="pl-8" />
          </form>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Select Crime Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {crimeTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedTypes.includes(type.id)}
                  onCheckedChange={() => handleTypeChange(type.id)}
                />
                <Label htmlFor={type.id} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: type.color }}
                  ></div>
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Select Radius (In Meter)
          </h2>
          <Slider
            value={[radius]}
            min={500}
            max={5000}
            step={500}
            onValueChange={(value) => setRadius(value[0])}
          />
          <p className="text-sm text-muted-foreground mt-1">{radius} meters</p>
        </div>

        <Button className="w-full" asChild>
          <Link href="/report">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Crime
          </Link>
        </Button>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative h-screen">
        <div className="inset-0 absolute z-10">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <MapController
              center={mapCenter}
              zoom={13}
              selectedIncident={selectedIncident}
              incidents={allIncidents}
            />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />

            {/* Add radius circle */}
            <Circle
              center={mapCenter}
              radius={radius}
              pathOptions={{
                fillColor: "#1e40af",
                fillOpacity: 0.1,
                color: "#3b82f6",
                weight: 1,
              }}
            />

            {/* Show all incidents on the map */}
            {allIncidents
              .filter((incident) => selectedTypes.includes(incident.type))
              .map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.latitude, incident.longitude]}
                  icon={L.divIcon({
                    className: `custom-div-icon ${
                      selectedIncident === incident.id ? "selected-marker" : ""
                    }`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                    html: `<div style="background-color: ${
                      crimeTypes.find((t) => t.id === incident.type)?.color ||
                      "#581845"
                    };" class="marker-pin ${
                      selectedIncident === incident.id
                        ? "selected-marker-pin"
                        : ""
                    }"></div>`,
                  })}
                  eventHandlers={{
                    click: () => {
                      // Only select the incident, don't open the dialog
                      setSelectedIncident(incident.id);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold">{incident.title}</h3>
                      <p className="text-sm">
                        {incident.address || "Unknown Location"}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {crimeTypes.find((t) => t.id === incident.type)
                          ?.label || "Other"}
                      </Badge>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(incident);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>

        {/* Incident Cards at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="overflow-x-auto whitespace-nowrap">
            <div className="inline-flex space-x-4">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <Card
                    key={incident.id}
                    className={`inline-block w-72 shrink-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer ${
                      selectedIncident === incident.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleCardClick(incident)}
                  >
                    {incident.imageUrl && (
                      <div className="w-full h-32 relative">
                        <img
                          src={incident.imageUrl || "/placeholder.svg"}
                          alt={incident.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base truncate">
                        {incident.title}
                      </CardTitle>
                      <CardDescription className="flex items-center text-xs break-words whitespace-normal">
                        <MapPin className="h-3 w-3 mr-1" />
                        {incident.address || "Unknown location"}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-2 flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor:
                              crimeTypes.find((t) => t.id === incident.type)
                                ?.color + "20",
                            color: crimeTypes.find(
                              (t) => t.id === incident.type
                            )?.color,
                          }}
                        >
                          {crimeTypes.find((t) => t.id === incident.type)
                            ?.label || "Other"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(incident);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="w-full text-center py-4 text-muted-foreground bg-white/80 rounded-lg">
                  No incidents found in this area
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Dialog */}
      <IncidentDetailDialog
        incident={selectedIncidentData}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Custom CSS for markers */}
      <style jsx global>{`
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: #c30b82;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -15px;
          transition: all 0.3s ease;
        }

        .marker-pin::after {
          content: "";
          width: 14px;
          height: 14px;
          margin: 8px 0 0 8px;
          background: #fff;
          position: absolute;
          border-radius: 50%;
        }

        .selected-marker-pin {
          width: 40px;
          height: 40px;
          margin: -20px 0 0 -20px;
          z-index: 1000 !important;
          filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
        }

        .selected-marker-pin::after {
          width: 18px;
          height: 18px;
          margin: 11px 0 0 11px;
        }
      `}</style>
    </div>
  );
}
