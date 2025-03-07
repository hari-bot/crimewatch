"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  User,
  ImageIcon,
} from "lucide-react";
import type { Incident } from "@/types";
import Image from "next/image";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Define crime types with their respective colors
const crimeTypes = [
  { id: "theft", label: "Theft", color: "#FF5733", icon: "🔒" },
  { id: "assault", label: "Assault", color: "#C70039", icon: "⚠️" },
  { id: "vandalism", label: "Vandalism", color: "#FFC300", icon: "🔨" },
  { id: "burglary", label: "Burglary", color: "#900C3F", icon: "🏠" },
  { id: "other", label: "Other", color: "#581845", icon: "❓" },
];

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
  const [activeTab, setActiveTab] = useState("details");

  if (!incident) return null;

  const crimeType = crimeTypes.find((t) => t.id === incident.type) || {
    id: "other",
    label: "Other",
    color: "#581845",
    icon: "❓",
  };

  const formattedDate = new Date(incident.createdAt).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const formattedTime = new Date(incident.createdAt).toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  // Custom marker icon
  const customIcon = L.divIcon({
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="background-color: ${crimeType.color};" class="marker-pin"></div>`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {/* <span className="text-xl">{crimeType.icon}</span> */}
            {incident.title}
          </DialogTitle>
          <DialogDescription>
            Reported on {formattedDate} at {formattedTime}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            {incident.imageUrl && (
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
            )}
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Type
                </p>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: crimeType.color + "20",
                    color: crimeType.color,
                  }}
                  className="text-sm"
                >
                  {crimeType.label}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge
                  variant={
                    incident.status === "resolved" ? "success" : "destructive"
                  }
                  className="text-sm"
                >
                  {incident.status === "resolved" ? "Resolved" : "Pending"}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <div className="p-4 rounded-md bg-muted">
                <p className="whitespace-pre-wrap">{incident.description}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Address
              </p>
              <p>{incident.address || "No address provided"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Reported Date
              </p>
              <p>{formattedDate}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Reported Time
              </p>
              <p>{formattedTime}</p>
            </div>

            {incident.updatedAt !== incident.createdAt && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p>
                  {new Date(incident.updatedAt).toLocaleDateString()} at{" "}
                  {new Date(incident.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            )}
          </TabsContent>

          {incident.imageUrl && (
            <TabsContent
              value="evidence"
              className="flex flex-col items-center justify-center"
            >
              <div className="relative w-full max-w-lg aspect-video mb-4 rounded-lg overflow-hidden border">
                <Image
                  src={incident.imageUrl || "/placeholder.svg"}
                  alt="Evidence image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Evidence image uploaded with this report
              </p>
            </TabsContent>
          )}

          <TabsContent value="location">
            <div className="h-[300px] w-full rounded-md overflow-hidden mb-4">
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
                  icon={customIcon}
                >
                  <Popup>{incident.title}</Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Latitude
                </p>
                <p>{incident.latitude.toFixed(6)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Longitude
                </p>
                <p>{incident.longitude.toFixed(6)}</p>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Address
              </p>
              <p>{incident.address || "No address provided"}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {incident.status === "pending" ? (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              Report as Resolved
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-amber-600 border-amber-600 hover:bg-amber-50"
            >
              Reopen Case
            </Button>
          )}
        </div>
      </DialogContent>

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
      `}</style>
    </Dialog>
  );
}
