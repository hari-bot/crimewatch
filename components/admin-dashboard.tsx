"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Incident } from "@/types";
import { crimeTypes, statusTypes } from "@/constants/incident-types";
import {
  calculateHotspots,
  formatDate,
  getMonthName,
} from "@/utils/admin-dashboard-utils";
import ListView from "@/components/admin/list-view";
import MapView from "@/components/admin/map-view";
import AnalyticsView from "@/components/admin/analytics-view";
import IncidentDetail from "@/components/admin/incident-detail";

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
    {
      center: [number, number];
      count: number;
      radius: number;
      incidents: Incident[];
      incidentsByType?: Record<string, number>;
      riskLevel?: string;
    }[]
  >([]);
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
          <ListView
            loading={loading}
            filteredIncidents={filteredIncidents}
            setSelectedIncident={setSelectedIncident}
            updateIncidentStatus={updateIncidentStatus}
            deleteIncident={deleteIncident}
          />
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          <MapView
            filteredIncidents={filteredIncidents}
            hotspots={hotspots}
            mapCenter={mapCenter}
            setMapCenter={setMapCenter}
            setSelectedIncident={setSelectedIncident}
            allIncidents={incidents}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <AnalyticsView
            loading={loading}
            incidents={incidents}
            analyticsData={analyticsData}
            analyticsTimeframe={analyticsTimeframe}
            setAnalyticsTimeframe={setAnalyticsTimeframe}
            hotspots={hotspots}
            toast={toast}
          />
        </TabsContent>
      </Tabs>

      {/* Incident Detail Sidebar */}
      <IncidentDetail
        selectedIncident={selectedIncident}
        setSelectedIncident={setSelectedIncident}
        updateIncidentStatus={updateIncidentStatus}
        deleteIncident={deleteIncident}
      />

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
