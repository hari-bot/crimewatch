"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    35.5951, -80.8104,
  ]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exifDebug, setExifDebug] = useState<string | null>(null);

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
          );
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = Number.parseFloat(lat);
        const longitude = Number.parseFloat(lon);

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
          );
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
    // Create an image element to use with EXIF.js
    const img = document.createElement("img");

    // Create a URL for the image
    const imageUrl = URL.createObjectURL(file);

    // Set up the image onload handler
    img.onload = () => {
      // Use EXIF.js to get the metadata
      EXIF.getData(img, function () {
        try {
          // Get all EXIF data for debugging
          const allTags = EXIF.getAllTags(this);
          setExifDebug(JSON.stringify(allTags, null, 2));

          console.log("EXIF data:", allTags);

          // Check if GPS data exists
          if (allTags.GPSLatitude && allTags.GPSLongitude) {
            // Convert coordinates from DMS (degrees, minutes, seconds) to decimal
            const latDegrees =
              allTags.GPSLatitude[0].numerator /
              allTags.GPSLatitude[0].denominator;
            const latMinutes =
              allTags.GPSLatitude[1].numerator /
              allTags.GPSLatitude[1].denominator;
            const latSeconds =
              allTags.GPSLatitude[2].numerator /
              allTags.GPSLatitude[2].denominator;

            const lngDegrees =
              allTags.GPSLongitude[0].numerator /
              allTags.GPSLongitude[0].denominator;
            const lngMinutes =
              allTags.GPSLongitude[1].numerator /
              allTags.GPSLongitude[1].denominator;
            const lngSeconds =
              allTags.GPSLongitude[2].numerator /
              allTags.GPSLongitude[2].denominator;

            let latitude = latDegrees + latMinutes / 60 + latSeconds / 3600;
            let longitude = lngDegrees + lngMinutes / 60 + lngSeconds / 3600;

            // Apply reference (N/S, E/W)
            if (allTags.GPSLatitudeRef === "S") latitude = -latitude;
            if (allTags.GPSLongitudeRef === "W") longitude = -longitude;

            console.log("Extracted coordinates:", latitude, longitude);

            // Update form data and map
            setFormData((prev) => ({
              ...prev,
              latitude,
              longitude,
            }));

            setMapCenter([latitude, longitude]);
            setMarkerPosition([latitude, longitude]);

            // Fetch address for the coordinates
            fetchAddressFromCoordinates(latitude, longitude);

            toast({
              title: "Location extracted",
              description:
                "Location data was found in your image and has been applied.",
            });
          } else {
            // Try alternative approach with binary data
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                try {
                  // Extract EXIF data from binary file
                  const exifData = extractExifDataFromArrayBuffer(
                    e.target.result as ArrayBuffer
                  );

                  if (
                    exifData &&
                    exifData.latitude !== undefined &&
                    exifData.longitude !== undefined
                  ) {
                    const { latitude, longitude } = exifData;

                    // Update form data and map
                    setFormData((prev) => ({
                      ...prev,
                      latitude,
                      longitude,
                    }));

                    setMapCenter([latitude, longitude]);
                    setMarkerPosition([latitude, longitude]);

                    // Fetch address for the coordinates
                    fetchAddressFromCoordinates(latitude, longitude);

                    toast({
                      title: "Location extracted",
                      description:
                        "Location data was found in your image and has been applied.",
                    });
                  } else {
                    console.log("No location data found in image");
                    toast({
                      title: "No location data",
                      description:
                        "This image doesn't contain location information.",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error("Error extracting binary EXIF data:", error);
                }
              }
            };
            reader.readAsArrayBuffer(file);
          }
        } catch (error) {
          console.error("Error extracting EXIF data:", error);
        }
      });
    };

    // Set the image source to trigger loading
    img.src = imageUrl;
  };

  // Function to extract EXIF data from ArrayBuffer
  const extractExifDataFromArrayBuffer = (arrayBuffer: ArrayBuffer) => {
    const dv = new DataView(arrayBuffer);
    let offset = 0;
    let latitude: number | undefined;
    let longitude: number | undefined;

    // Check for JPEG SOI marker
    if (dv.getUint16(0, false) !== 0xffd8) {
      return null;
    }

    offset += 2;

    // Look for APP1 marker (EXIF data)
    while (offset < dv.byteLength) {
      if (offset + 2 > dv.byteLength) break;

      const marker = dv.getUint16(offset, false);
      offset += 2;

      // APP1 marker (0xFFE1)
      if (marker === 0xffe1) {
        if (offset + 2 > dv.byteLength) break;

        const length = dv.getUint16(offset, false);
        if (offset + length > dv.byteLength) break;

        // Check for "Exif" string
        if (
          offset + 6 <= dv.byteLength &&
          dv.getUint32(offset + 2, false) === 0x45786966 && // "Exif"
          dv.getUint16(offset + 6, false) === 0x0000
        ) {
          // followed by two 0 bytes

          const tiffOffset = offset + 8; // Start of TIFF header

          // Check byte order
          if (tiffOffset + 4 > dv.byteLength) break;

          const byteOrder = dv.getUint16(tiffOffset, false);
          const littleEndian = byteOrder === 0x4949; // 'II' for Intel byte order

          // Check TIFF header
          if (dv.getUint16(tiffOffset + 2, littleEndian) !== 0x002a) break;

          // Get offset to first IFD
          const firstIFDOffset = dv.getUint32(tiffOffset + 4, littleEndian);
          const ifdOffset = tiffOffset + firstIFDOffset;

          if (ifdOffset + 2 > dv.byteLength) break;

          // Number of directory entries
          const numEntries = dv.getUint16(ifdOffset, littleEndian);

          if (ifdOffset + 2 + numEntries * 12 > dv.byteLength) break;

          // Look for GPS IFD pointer
          let gpsInfoOffset = null;
          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + 2 + i * 12;
            const tag = dv.getUint16(entryOffset, littleEndian);

            if (tag === 0x8825) {
              // GPS Info tag
              const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);
              gpsInfoOffset = tiffOffset + valueOffset;
              break;
            }
          }

          if (gpsInfoOffset && gpsInfoOffset + 2 <= dv.byteLength) {
            const gpsEntries = dv.getUint16(gpsInfoOffset, littleEndian);

            if (gpsInfoOffset + 2 + gpsEntries * 12 > dv.byteLength) break;

            let latRef: string | null = null;
            let latValue: number[] | null = null;
            let longRef: string | null = null;
            let longValue: number[] | null = null;

            for (let i = 0; i < gpsEntries; i++) {
              const entryOffset = gpsInfoOffset + 2 + i * 12;
              const tag = dv.getUint16(entryOffset, littleEndian);

              if (tag === 1) {
                // GPSLatitudeRef
                const format = dv.getUint16(entryOffset + 2, littleEndian);
                const components = dv.getUint32(entryOffset + 4, littleEndian);
                const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);

                if (format === 2) {
                  // ASCII string
                  const strOffset =
                    components > 4 ? tiffOffset + valueOffset : entryOffset + 8;
                  if (strOffset < dv.byteLength) {
                    latRef = String.fromCharCode(dv.getUint8(strOffset));
                  }
                }
              } else if (tag === 2) {
                // GPSLatitude
                const format = dv.getUint16(entryOffset + 2, littleEndian);
                const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);

                if (format === 5) {
                  // Rational
                  const rationalOffset = tiffOffset + valueOffset;
                  if (rationalOffset + 24 <= dv.byteLength) {
                    latValue = [
                      dv.getUint32(rationalOffset, littleEndian) /
                        dv.getUint32(rationalOffset + 4, littleEndian),
                      dv.getUint32(rationalOffset + 8, littleEndian) /
                        dv.getUint32(rationalOffset + 12, littleEndian),
                      dv.getUint32(rationalOffset + 16, littleEndian) /
                        dv.getUint32(rationalOffset + 20, littleEndian),
                    ];
                  }
                }
              } else if (tag === 3) {
                // GPSLongitudeRef
                const format = dv.getUint16(entryOffset + 2, littleEndian);
                const components = dv.getUint32(entryOffset + 4, littleEndian);
                const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);

                if (format === 2) {
                  // ASCII string
                  const strOffset =
                    components > 4 ? tiffOffset + valueOffset : entryOffset + 8;
                  if (strOffset < dv.byteLength) {
                    longRef = String.fromCharCode(dv.getUint8(strOffset));
                  }
                }
              } else if (tag === 4) {
                // GPSLongitude
                const format = dv.getUint16(entryOffset + 2, littleEndian);
                const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);

                if (format === 5) {
                  // Rational
                  const rationalOffset = tiffOffset + valueOffset;
                  if (rationalOffset + 24 <= dv.byteLength) {
                    longValue = [
                      dv.getUint32(rationalOffset, littleEndian) /
                        dv.getUint32(rationalOffset + 4, littleEndian),
                      dv.getUint32(rationalOffset + 8, littleEndian) /
                        dv.getUint32(rationalOffset + 12, littleEndian),
                      dv.getUint32(rationalOffset + 16, littleEndian) /
                        dv.getUint32(rationalOffset + 20, littleEndian),
                    ];
                  }
                }
              }
            }

            if (latRef && latValue && longRef && longValue) {
              latitude = convertToDecimalDegrees(latValue);
              if (latRef === "S") latitude = -latitude;

              longitude = convertToDecimalDegrees(longValue);
              if (longRef === "W") longitude = -longitude;

              return { latitude, longitude };
            }
          }
        }

        offset += length - 2;
      } else if ((marker & 0xff00) !== 0xff00) {
        break;
      } else {
        if (offset + 2 > dv.byteLength) break;
        offset += dv.getUint16(offset, false);
      }
    }

    return null;
  };

  // Convert degrees, minutes, seconds to decimal degrees
  const convertToDecimalDegrees = (dms: number[]): number => {
    return dms[0] + dms[1] / 60 + dms[2] / 3600;
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
                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      position={markerPosition}
                      setPosition={setMarkerPosition}
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
                <div className="mt-1.5 flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
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
                    <div className="text-sm text-muted-foreground">
                      No image selected
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  If your image contains location data, it will be automatically
                  extracted.
                </p>
              </div>

              {exifDebug && (
                <div className="mt-4 p-2 bg-gray-100 rounded-md">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">
                      Image Metadata (Debug)
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-gray-800 text-gray-200 rounded">
                      {exifDebug}
                    </pre>
                  </details>
                </div>
              )}
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
