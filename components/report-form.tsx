"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { crimeTypes } from "@/constants/crime-types";
import { fetchAddressFromCoordinates } from "@/utils/location-utils";
import LocationMarker from "@/components/map/location-marker";
import ChangeMapView from "@/components/report/map-view-control";
import LocationSearch from "@/components/report/location-search";
import ImageUpload from "@/components/report/image-upload";

export default function ReportForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    latitude: 0,
    longitude: 0,
    address: "",
  });

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    35.5951, -80.8104,
  ]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setMapCenter(newCenter);
          setMarkerPosition(newCenter);
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));

          fetchAddressFromCoordinates(
            position.coords.latitude,
            position.coords.longitude
          ).then((address) => {
            if (address) {
              setFormData((prev) => ({ ...prev, address }));
            }
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location access denied",
            description: "Please search for a location or click on the map",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    fetchAddressFromCoordinates(lat, lng).then((address) => {
      if (address) {
        setFormData((prev) => ({ ...prev, address }));
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setMapCenter(newCenter);
          setMarkerPosition(newCenter);
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));

          fetchAddressFromCoordinates(
            position.coords.latitude,
            position.coords.longitude
          ).then((address) => {
            if (address) {
              setFormData((prev) => ({ ...prev, address }));
            }
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location access denied",
            description: "Please search for a location or click on the map",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleLocationFound = async (
    lat: number,
    lng: number,
    address?: string
  ) => {
    setMapCenter([lat, lng]);
    setMarkerPosition([lat, lng]);

    if (!address) {
      address = await fetchAddressFromCoordinates(lat, lng);
    }

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }));
  };

  const handleImageSelected = (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.type) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.latitude === 0 && formData.longitude === 0) {
        throw new Error("Please select a location on the map");
      }

      // Create form data for file upload
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("type", formData.type);
      submitData.append("latitude", formData.latitude.toString());
      submitData.append("longitude", formData.longitude.toString());
      submitData.append("address", formData.address);

      if (imageFile) {
        submitData.append("image", imageFile);
      }

      // Submit the report
      const response = await fetch("/api/incidents", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit report");
      }

      toast({
        title: "Report submitted",
        description: "Your crime report has been submitted successfully.",
      });

      // Redirect to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Report a Crime</CardTitle>
          <CardDescription>
            Provide details about the incident you want to report. Your
            information helps keep the community safe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Incident Title</Label>
                <Input
                  id="title"
                  placeholder="Brief title describing the incident"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Crime Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crime type" />
                  </SelectTrigger>
                  <SelectContent>
                    {crimeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about what happened"
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Location</Label>
                <div className="mb-2">
                  <LocationSearch
                    onLocationFound={handleLocationFound}
                    toast={toast}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleUseCurrentLocation}
                  >
                    Use Current Location
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latitude: Number.parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          longitude: Number.parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="h-64 rounded-md overflow-hidden border mt-1.5">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ChangeMapView center={mapCenter} />
                    <LocationMarker
                      position={markerPosition}
                      setPosition={(position) => {
                        setMarkerPosition(position);
                        if (position) {
                          handleLocationSelect(position[0], position[1]);
                        }
                      }}
                    />
                  </MapContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {formData.address || "Click on the map to select a location"}
                </p>
              </div>

              <div>
                <Label htmlFor="image">Evidence Image (Optional)</Label>
                <ImageUpload
                  onImageSelected={handleImageSelected}
                  onLocationExtracted={(lat, lng) => {
                    handleLocationFound(lat, lng);
                  }}
                  toast={toast}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  If your image contains location data, it will be automatically
                  extracted.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
