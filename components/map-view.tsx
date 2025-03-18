"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer as LeafletTileLayer,
  Circle as LeafletCircle,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import type { Incident } from "@/types";
import { useSession } from "next-auth/react";
import { crimeTypes } from "@/constants/crime-types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import MapController from "@/components/map-controller";
import LocationMarker from "@/components/map/location-marker";
import IncidentMarker from "@/components/map/incident-marker";
import IncidentCarousel from "@/components/map/incident-carousel";
import FilterSidebar from "@/components/map/filter-sidebar";
import SidebarToggle from "@/components/map/sidebar-toggle";
import IncidentDetailDialog from "@/components/map/incident-detail-dialog";
import { fetchAddressFromCoordinates } from "@/utils/location-utils";

export default function MapView() {
  // Add a new state for carousel visibility
  const [showCarousel, setShowCarousel] = useState(true);
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const locationRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    // Close sidebar on mobile by default
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          locationRef.current = currentLocation;
          setMapCenter(currentLocation);
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
  }, [radius]);

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

  const getLeafletMap = () => {
    const mapElement = document.querySelector(".leaflet-container");
    return mapElement ? (mapElement as any)._leaflet_map : null;
  };

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident.id);
    setSelectedIncidentData(incident);
    setDetailDialogOpen(true);

    // Fly to the incident location
    const map = getLeafletMap();
    if (map) {
      map.flyTo([incident.latitude, incident.longitude], 15);
    }
  };

  const handleCardClick = (incident: Incident) => {
    setSelectedIncident(incident.id);

    // Fly to the incident location without opening the dialog
    const map = getLeafletMap();
    if (map) {
      map.flyTo([incident.latitude, incident.longitude], 15);
    }
  };

  const handleLocationSearch = async (lat: number, lng: number) => {
    const newCenter: LatLngExpression = [lat, lng];
    locationRef.current = newCenter;
    setMapCenter(newCenter);
    fetchIncidents(lat, lng, radius);
    const address = await fetchAddressFromCoordinates(lat, lng);
    if (address) {
      console.log(`Found address: ${address}`);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: LatLngExpression = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          locationRef.current = newCenter;
          setMapCenter(newCenter);
          setSelectedIncident(null); // Clear selected incident
          setSelectedIncidentData(null); // Clear selected incident data
          fetchIncidents(position.coords.latitude, position.coords.longitude, radius);
          const map = getLeafletMap();
          if (map) {
            map.flyTo(newCenter, 13); // Fly to the new location
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const handleLocationFound = (lat: number, lng: number, address?: string) => {
    const newCenter: LatLngExpression = [lat, lng];
    locationRef.current = newCenter;
    setMapCenter(newCenter);
    fetchIncidents(lat, lng, radius);
  };

  // Add a function to toggle the carousel visibility
  const toggleCarousel = () => {
    setShowCarousel((prev) => !prev);
  };

  const filteredIncidents = incidents.filter((incident) =>
    selectedTypes.includes(incident.type)
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] w-full relative">
      {/* Mobile Sidebar Toggle */}
      <SidebarToggle
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Sidebar */}
      <FilterSidebar
        selectedTypes={selectedTypes}
        onTypeChange={handleTypeChange}
        radius={radius}
        onRadiusChange={setRadius}
        onLocationSearch={handleLocationSearch}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        showCarousel={showCarousel}
        onToggleCarousel={toggleCarousel}
      />

      {/* Map Container */}
      <div className="flex-1 relative h-full">
        <div className="absolute inset-0 z-10">
          <LeafletMapContainer
            center={mapCenter as L.LatLngExpression}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <ZoomControl position="bottomright" />
            <MapController
              center={mapCenter}
              zoom={13}
              selectedIncident={selectedIncident}
              incidents={allIncidents}
            />
            <LeafletTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />

            {/* Add radius circle */}
            <LeafletCircle
              center={mapCenter as L.LatLngExpression}
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
          </LeafletMapContainer>
        </div>

        {/* Incident Cards at Bottom */}
        <div
          className={`absolute bottom-4 left-0 right-0 z-20 px-4 transition-all duration-300 ease-in-out ${
            showCarousel
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-16 pointer-events-none"
          }`}
        >
          <div className="bg-background/80 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-5xl mx-auto">
            <IncidentCarousel
              incidents={filteredIncidents}
              selectedIncident={selectedIncident}
              onCardClick={handleCardClick}
              onViewDetails={handleViewDetails}
              showCarousel={showCarousel}
              onToggleCarousel={toggleCarousel}
            />
          </div>
        </div>
      </div>

      {/* Incident Detail Dialog */}
      <IncidentDetailDialog
        incident={selectedIncidentData}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Add a floating toggle button when carousel is hidden */}
      {!showCarousel && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleCarousel}
            className="rounded-full shadow-md px-3 py-1 h-auto bg-background/90 backdrop-blur-sm hover:bg-background/95 border"
          >
            <ChevronUp className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Show Incidents</span>
          </Button>
        </div>
      )}

      {/* Custom CSS for markers */}
      <style jsx global>{`
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -15px;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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

        /* Improve map controls */
        .leaflet-control-zoom {
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }

        .leaflet-control-zoom a {
          background-color: white !important;
          color: #333 !important;
        }

        .leaflet-control-zoom a:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </div>
  );
}
