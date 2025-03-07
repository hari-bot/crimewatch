"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
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
import { AlertCircle, MapPin, Upload, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import EXIF from "exif-js";

const crimeTypes = [
  { id: "theft", label: "Theft" },
  { id: "assault", label: "Assault" },
  { id: "vandalism", label: "Vandalism" },
  { id: "burglary", label: "Burglary" },
  { id: "other", label: "Other" },
];

function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13); // Ensuring map moves to the searched location
  }, [center, map]);
  return null;
}

function LocationPicker({
  onLocationSelect,
  position,
  setPosition,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  position: [number, number] | null;
  setPosition: (position: [number, number] | null) => void;
}) {
  const map = useMapEvents({
    click(e: any) {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function ReportForm() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    latitude: 0,
    longitude: 0,
    address: "",
  });

  const [mapCenter, setMapCenter] = useState<[number, number]>([35.5951, -80.8104]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: [number, number] = [position.coords.latitude, position.coords.longitude];
          setMapCenter(newCenter);
          setMarkerPosition(newCenter);
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));

          fetchAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
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
    fetchAddressFromCoordinates(lat, lng);
  };

  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        setFormData((prev) => ({
          ...prev,
          address: data.display_name,
        }));
      }
    } catch (err) {
      console.error("Error getting address:", err);
    }
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = searchInputRef.current?.value;
    if (!searchQuery) return;

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        setMapCenter([latitude, longitude]); // Updates the map
        setMarkerPosition([latitude, longitude]);

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          address: data[0].display_name || prev.address,
        }));

        toast({
          title: "Location found",
          description: `Found location: ${data[0].display_name}`,
        });
      } else {
        toast({
          title: "Location not found",
          description: "Could not find the location you searched for",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error searching location:", err);
      toast({
        title: "Search error",
        description: "An error occurred while searching for the location",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: [number, number] = [position.coords.latitude, position.coords.longitude];
          setMapCenter(newCenter);
          setMarkerPosition(newCenter);
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));

          fetchAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Try to extract location from image metadata
      extractImageLocation(file);
    }
  };

  const extractImageLocation = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        try {
          const exif = EXIF.readFromBinaryFile(e.target.result as ArrayBuffer);
          if (exif && exif.GPSLatitude && exif.GPSLongitude) {
            // Convert GPS coordinates to decimal
            const lat = exif.GPSLatitude[0] + exif.GPSLatitude[1] / 60 + exif.GPSLatitude[2] / 3600;
            const lng = exif.GPSLongitude[0] + exif.GPSLongitude[1] / 60 + exif.GPSLongitude[2] / 3600;

            // Apply GPS reference (N/S, E/W)
            const latRef = exif.GPSLatitudeRef || "N";
            const lngRef = exif.GPSLongitudeRef || "E";
            const latitude = latRef === "N" ? lat : -lat;
            const longitude = lngRef === "E" ? lng : -lng;

            setFormData((prev) => ({
              ...prev,
              latitude,
              longitude,
            }));

            setMapCenter([latitude, longitude]);

            toast({
              title: "Location extracted",
              description: "Location data was found in your image and has been applied.",
            });
          }
        } catch (error) {
          console.error("Error extracting EXIF data:", error);
        }
      }
    };
    reader.readAsArrayBuffer(file);
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
            Provide details about the incident you want to report. Your information helps keep the community safe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Incident Title</Label>
                <Input
                  id="title"
                  placeholder="Brief title describing the incident"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Crime Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Location</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for a location"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchLocation}
                    disabled={isSearching}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="h-64 rounded-md overflow-hidden border mt-1.5">
                  <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ChangeMapView center={mapCenter} />
                    <LocationPicker onLocationSelect={handleLocationSelect} position={markerPosition} setPosition={setMarkerPosition} />
                  </MapContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {formData.address || "Click on the map to select a location"}
                </p>
              </div>

              <div>
                <Label htmlFor="image">Evidence Image (Optional)</Label>
                <div className="mt-1.5 flex items-center gap-4">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <Input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <div className="relative h-16 w-16 rounded-md overflow-hidden">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No image selected</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  If your image contains location data, it will be automatically extracted.
                </p>
              </div>
            </div>
          </form>
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

