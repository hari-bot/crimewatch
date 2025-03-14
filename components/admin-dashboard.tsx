"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Incident } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Trash2,
  AlertTriangle,
  Eye,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  FileText,
  Filter,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// Define crime types with their respective colors
const crimeTypes = [
  { id: "theft", label: "Theft", color: "#FF5733" },
  { id: "assault", label: "Assault", color: "#C70039" },
  { id: "vandalism", label: "Vandalism", color: "#FFC300" },
  { id: "burglary", label: "Burglary", color: "#900C3F" },
  { id: "other", label: "Other", color: "#581845" },
];

// Define status types
const statusTypes = [
  { id: "pending", label: "Pending", icon: Clock, color: "#FFC107" },
  {
    id: "investigating",
    label: "Investigating",
    icon: Search,
    color: "#2196F3",
  },
  { id: "resolved", label: "Resolved", icon: CheckCircle, color: "#4CAF50" },
  { id: "dismissed", label: "Dismissed", icon: Trash2, color: "#9E9E9E" },
];

// Component to update map view when center changes
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

// Function to calculate hotspots
function calculateHotspots(incidents: Incident[]) {
  // Group incidents by proximity
  const hotspots: {
    center: [number, number];
    count: number;
    radius: number;
  }[] = [];

  // Process each incident
  incidents.forEach((incident) => {
    const incidentLocation: [number, number] = [
      incident.latitude,
      incident.longitude,
    ];

    // Check if this incident is near an existing hotspot
    let addedToHotspot = false;
    for (const hotspot of hotspots) {
      // Calculate distance between incident and hotspot center
      const distance = calculateDistance(
        incidentLocation[0],
        incidentLocation[1],
        hotspot.center[0],
        hotspot.center[1]
      );

      // If within 1km, add to this hotspot
      if (distance < 1) {
        hotspot.count += 1;
        // Recalculate center as average of all points (simplified approach)
        hotspot.center = [
          (hotspot.center[0] * (hotspot.count - 1) + incidentLocation[0]) /
            hotspot.count,
          (hotspot.center[1] * (hotspot.count - 1) + incidentLocation[1]) /
            hotspot.count,
        ];
        // Adjust radius based on count (more incidents = larger radius)
        hotspot.radius = Math.min(500 + hotspot.count * 100, 2000);
        addedToHotspot = true;
        break;
      }
    }

    // If not added to any existing hotspot, create a new one
    if (!addedToHotspot) {
      hotspots.push({
        center: incidentLocation,
        count: 1,
        radius: 500, // Base radius in meters
      });
    }
  });

  // Filter out hotspots with only 1 incident
  return hotspots.filter((hotspot) => hotspot.count > 1);
}

// Calculate distance between two points in km using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Function to format date for grouping
function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

// Function to get month name
function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month];
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    35.5951, -80.8104,
  ]);
  const [hotspots, setHotspots] = useState<
    { center: [number, number]; count: number; radius: number }[]
  >([]);
  const [showHotspots, setShowHotspots] = useState(true);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<string>("month");

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    // Calculate hotspots whenever incidents change
    if (incidents.length > 0) {
      const calculatedHotspots = calculateHotspots(incidents);
      setHotspots(calculatedHotspots);

      // If we have incidents, center the map on the first one
      if (incidents.length > 0) {
        setMapCenter([incidents[0].latitude, incidents[0].longitude]);
      }
    }
  }, [incidents]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/incidents");
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load incidents",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/incidents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setIncidents(
        incidents.map((incident) =>
          incident.id === id ? { ...incident, status } : incident
        )
      );

      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident({ ...selectedIncident, status });
      }

      toast({
        title: "Status updated",
        description: `Incident status has been updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating incident status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update incident status",
      });
    }
  };

  const deleteIncident = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/incidents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete incident");
      }

      // Update local state
      setIncidents(incidents.filter((incident) => incident.id !== id));

      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident(null);
      }

      toast({
        title: "Incident deleted",
        description: "The incident has been permanently deleted",
      });
    } catch (error) {
      console.error("Error deleting incident:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete incident",
      });
    }
  };

  // Filter incidents based on status, type, and search query
  const filteredIncidents = incidents.filter((incident) => {
    const matchesStatus =
      statusFilter === "all" || incident.status === statusFilter;
    const matchesType = typeFilter === "all" || incident.type === typeFilter;
    const matchesSearch =
      searchQuery === "" ||
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (incident.address &&
        incident.address.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Custom marker icon based on crime type
  const getMarkerIcon = (type: string) => {
    const crimeType = crimeTypes.find((t) => t.id === type) || crimeTypes[4]; // Default to "other"

    return L.divIcon({
      className: "custom-div-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: `<div style="background-color: ${crimeType.color};" class="marker-pin"></div>`,
    });
  };

  // Analytics data preparation
  const analyticsData = useMemo(() => {
    if (!incidents.length) return null;

    // Count incidents by type
    const byType = crimeTypes.map((type) => ({
      name: type.label,
      value: incidents.filter((incident) => incident.type === type.id).length,
      color: type.color,
    }));

    // Count incidents by status
    const byStatus = statusTypes.map((status) => ({
      name: status.label,
      value: incidents.filter((incident) => incident.status === status.id)
        .length,
      color: status.color,
    }));

    // Incidents over time
    const now = new Date();
    const timeData: { name: string; count: number }[] = [];

    if (analyticsTimeframe === "week") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        const count = incidents.filter(
          (incident) => formatDate(new Date(incident.createdAt)) === dateStr
        ).length;
        timeData.push({
          name: date.toLocaleDateString("en-US", { weekday: "short" }),
          count,
        });
      }
    } else if (analyticsTimeframe === "month") {
      // Last 30 days grouped by week
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - i * 7);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const count = incidents.filter((incident) => {
          const incidentDate = new Date(incident.createdAt);
          return incidentDate >= startDate && incidentDate <= endDate;
        }).length;

        timeData.push({
          name: `${startDate.getMonth() + 1}/${startDate.getDate()}-${
            endDate.getMonth() + 1
          }/${endDate.getDate()}`,
          count,
        });
      }
    } else if (analyticsTimeframe === "year") {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthYear = `${getMonthName(date.getMonth()).substring(0, 3)}`;

        const count = incidents.filter((incident) => {
          const incidentDate = new Date(incident.createdAt);
          return (
            incidentDate.getMonth() === date.getMonth() &&
            incidentDate.getFullYear() === date.getFullYear()
          );
        }).length;

        timeData.push({ name: monthYear, count });
      }
    }

    // Resolution rate
    const totalIncidents = incidents.length;
    const resolvedIncidents = incidents.filter(
      (incident) => incident.status === "resolved"
    ).length;
    const resolutionRate =
      totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0;

    // Average resolution time (for resolved incidents)
    const resolvedIncidentsWithTime = incidents
      .filter((incident) => incident.status === "resolved")
      .map((incident) => {
        const createdAt = new Date(incident.createdAt);
        const updatedAt = new Date(incident.updatedAt);
        const resolutionTimeHours =
          (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return resolutionTimeHours;
      });

    const avgResolutionTime =
      resolvedIncidentsWithTime.length > 0
        ? resolvedIncidentsWithTime.reduce((sum, time) => sum + time, 0) /
          resolvedIncidentsWithTime.length
        : 0;

    // Incidents by time of day
    const byTimeOfDay = [
      { name: "Morning (6AM-12PM)", value: 0 },
      { name: "Afternoon (12PM-6PM)", value: 0 },
      { name: "Evening (6PM-12AM)", value: 0 },
      { name: "Night (12AM-6AM)", value: 0 },
    ];

    incidents.forEach((incident) => {
      const date = new Date(incident.createdAt);
      const hour = date.getHours();

      if (hour >= 6 && hour < 12) byTimeOfDay[0].value++;
      else if (hour >= 12 && hour < 18) byTimeOfDay[1].value++;
      else if (hour >= 18 && hour < 24) byTimeOfDay[2].value++;
      else byTimeOfDay[3].value++;
    });

    // Heatmap data (simplified for this example)
    const heatmapData = hotspots.map((hotspot) => ({
      location: hotspot.center,
      weight: hotspot.count,
    }));

    return {
      byType,
      byStatus,
      timeData,
      resolutionRate,
      avgResolutionTime,
      byTimeOfDay,
      heatmapData,
      totalIncidents,
      resolvedIncidents,
      pendingIncidents: incidents.filter(
        (incident) => incident.status === "pending"
      ).length,
      investigatingIncidents: incidents.filter(
        (incident) => incident.status === "investigating"
      ).length,
    };
  }, [incidents, analyticsTimeframe, hotspots]);

  // Function to export analytics data as CSV
  const exportAnalyticsCSV = () => {
    if (!incidents.length) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Headers
    csvContent +=
      "ID,Title,Type,Status,Latitude,Longitude,Address,Created At,Updated At\n";

    // Data rows
    incidents.forEach((incident) => {
      const row = [
        incident.id,
        `"${incident.title.replace(/"/g, '""')}"`,
        incident.type,
        incident.status,
        incident.latitude,
        incident.longitude,
        `"${(incident.address || "").replace(/"/g, '""')}"`,
        new Date(incident.createdAt).toISOString(),
        new Date(incident.updatedAt).toISOString(),
      ];
      csvContent += row.join(",") + "\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `crime_incidents_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);

    // Trigger download
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${incidents.length} incidents to CSV file.`,
    });
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusTypes.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {crimeTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Reported Incidents</CardTitle>
              <CardDescription>
                Manage and update the status of reported incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading incidents...</div>
              ) : filteredIncidents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reported On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-medium">
                          {incident.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {crimeTypes.find((t) => t.id === incident.type)
                              ?.label || "Other"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {incident.address || "Unknown location"}
                        </TableCell>
                        <TableCell>
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              incident.status === "resolved"
                                ? "default"
                                : "outline"
                            }
                            className={
                              incident.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : incident.status === "investigating"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : incident.status === "resolved"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {statusTypes.find((s) => s.id === incident.status)
                              ?.label || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedIncident(incident)}
                            >
                              View
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Update
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Update Incident Status
                                  </DialogTitle>
                                  <DialogDescription>
                                    Change the status of this incident
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Select
                                    defaultValue={incident.status}
                                    onValueChange={(value) =>
                                      updateIncidentStatus(incident.id, value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusTypes.map((status) => (
                                        <SelectItem
                                          key={status.id}
                                          value={status.id}
                                        >
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {}}>
                                    Cancel
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Incident</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this
                                    incident? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {}}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => deleteIncident(incident.id)}
                                  >
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No incidents found matching your filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-0">
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
                            setMapCenter([
                              incident.latitude,
                              incident.longitude,
                            ]);
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
                                {statusTypes.find(
                                  (s) => s.id === incident.status
                                )?.label || "Pending"}
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
                              {new Date(
                                incident.createdAt
                              ).toLocaleDateString()}
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
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Crime Analytics Dashboard</h2>
            <div className="flex items-center gap-4">
              <Select
                value={analyticsTimeframe}
                onValueChange={setAnalyticsTimeframe}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportAnalyticsCSV}
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading analytics data...</div>
          ) : !analyticsData ? (
            <div className="text-center py-8 text-muted-foreground">
              No incident data available for analysis
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Incidents
                        </p>
                        <h3 className="text-2xl font-bold">
                          {analyticsData.totalIncidents}
                        </h3>
                      </div>
                      <FileText className="h-8 w-8 text-primary opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Resolution Rate
                        </p>
                        <h3 className="text-2xl font-bold">
                          {analyticsData.resolutionRate.toFixed(1)}%
                        </h3>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Avg. Resolution Time
                        </p>
                        <h3 className="text-2xl font-bold">
                          {analyticsData.avgResolutionTime.toFixed(1)} hrs
                        </h3>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500 opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Crime Hotspots
                        </p>
                        <h3 className="text-2xl font-bold">
                          {hotspots.length}
                        </h3>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Incidents Over Time
                    </CardTitle>
                    <CardDescription>
                      Number of reported incidents by{" "}
                      {analyticsTimeframe === "week"
                        ? "day"
                        : analyticsTimeframe === "month"
                        ? "week"
                        : "month"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={analyticsData.timeData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="count"
                            name="Incidents"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Incidents by Type
                    </CardTitle>
                    <CardDescription>
                      Distribution of incidents across different crime
                      categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={analyticsData.byType}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {analyticsData.byType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Incidents by Status
                    </CardTitle>
                    <CardDescription>
                      Current status of all reported incidents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.byStatus}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" name="Incidents">
                            {analyticsData.byStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Incidents by Time of Day
                    </CardTitle>
                    <CardDescription>
                      When incidents are most frequently reported
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.byTimeOfDay}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="value"
                            name="Incidents"
                            fill="#8884d8"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Incident Status Breakdown
                  </CardTitle>
                  <CardDescription>
                    Detailed view of incident processing status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {statusTypes.map((status) => (
                      <div
                        key={status.id}
                        className="flex flex-col items-center p-4 border rounded-lg"
                      >
                        <div
                          className="p-3 rounded-full mb-2"
                          style={{ backgroundColor: `${status.color}20` }}
                        >
                          <status.icon
                            className="h-6 w-6"
                            style={{ color: status.color }}
                          />
                        </div>
                        <h3 className="text-lg font-semibold">
                          {status.label}
                        </h3>
                        <p className="text-3xl font-bold mt-2">
                          {
                            incidents.filter(
                              (incident) => incident.status === status.id
                            ).length
                          }
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(
                            (incidents.filter(
                              (incident) => incident.status === status.id
                            ).length /
                              incidents.length) *
                            100
                          ).toFixed(1)}
                          % of total
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Incident Detail Sidebar */}
      {selectedIncident && (
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
              <h3 className="text-lg font-semibold">
                {selectedIncident.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {crimeTypes.find((t) => t.id === selectedIncident.type)
                    ?.label || "Other"}
                </Badge>
                <Badge
                  variant={
                    selectedIncident.status === "resolved"
                      ? "default"
                      : "outline"
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
                  center={[
                    selectedIncident.latitude,
                    selectedIncident.longitude,
                  ]}
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
                    if (
                      confirm("Are you sure you want to delete this incident?")
                    ) {
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
    </div>
  );
}
