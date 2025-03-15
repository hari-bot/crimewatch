"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import type { Incident } from "@/types";
import { useSession } from "next-auth/react";
import { crimeTypes } from "@/constants/crime-types";
import MapController from "@/components/map-controller";
import LocationMarker from "@/components/map/location-marker";
import IncidentMarker from "@/components/map/incident-marker";
import IncidentCard from "@/components/map/incident-card";
import FilterSidebar from "@/components/map/filter-sidebar";
import IncidentDetailDialog from "./incident-detail-dialouge";

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

  const handleLocationSearch = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    fetchIncidents(lat, lng, radius);
  };

  const filteredIncidents = incidents.filter((incident) =>
    selectedTypes.includes(incident.type)
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Sidebar */}
      <FilterSidebar
        selectedTypes={selectedTypes}
        onTypeChange={handleTypeChange}
        radius={radius}
        onRadiusChange={setRadius}
        onLocationSearch={handleLocationSearch}
      />

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
                <IncidentMarker
                  key={incident.id}
                  incident={incident}
                  isSelected={selectedIncident === incident.id}
                  onSelect={setSelectedIncident}
                  onViewDetails={handleViewDetails}
                />
              ))}
          </MapContainer>
        </div>

        {/* Incident Cards at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="overflow-x-auto whitespace-nowrap">
            <div className="inline-flex space-x-4">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    isSelected={selectedIncident === incident.id}
                    onClick={() => handleCardClick(incident)}
                    onViewDetails={() => handleViewDetails(incident)}
                  />
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
