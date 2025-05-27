"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  ArrowUpRight,
  Eye,
  Filter,
  Download,
  Search,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { crimeTypes, statusTypes } from "@/constants/crime-types";
import type { Incident } from "@/types";
import IncidentDetailDialog from "@/components/map/incident-detail-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UserReports() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchUserIncidents();
  }, []);

  const fetchUserIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/incidents");
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error("Error fetching user incidents:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your reports",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailDialogOpen(true);
  };

  // Filter incidents based on search query and status filter
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      searchQuery === "" ||
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (incident.address &&
        incident.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || incident.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Group incidents by status for the dashboard display
  const pendingIncidents = incidents.filter(
    (i) => i.status === "pending"
  ).length;
  const investigatingIncidents = incidents.filter(
    (i) => i.status === "investigating"
  ).length;
  const resolvedIncidents = incidents.filter(
    (i) => i.status === "resolved"
  ).length;
  const dismissedIncidents = incidents.filter(
    (i) => i.status === "dismissed"
  ).length;

  // Get status badge styling
  const getStatusBadgeStyles = (status: string) => {
    const statusInfo =
      statusTypes.find((s) => s.id === status) || statusTypes[0];
    return {
      backgroundColor: `${statusInfo.color}20`,
      color: statusInfo.color,
      borderColor: `${statusInfo.color}40`,
    };
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold">My Reports</h1>
        <p className="text-muted-foreground">
          View and manage all crime incidents you have reported
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your reports..."
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
        </div>
        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Reports
                    </p>
                    <h3 className="text-2xl font-bold">{incidents.length}</h3>
                  </div>
                  <Filter className="h-8 w-8 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Pending
                    </p>
                    <h3 className="text-2xl font-bold">{pendingIncidents}</h3>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Investigating
                    </p>
                    <h3 className="text-2xl font-bold">
                      {investigatingIncidents}
                    </h3>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Resolved
                    </p>
                    <h3 className="text-2xl font-bold">{resolvedIncidents}</h3>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>
                  Your most recently submitted incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {filteredIncidents.slice(0, 5).map((incident) => {
                    const statusStyle = getStatusBadgeStyles(incident.status);
                    const crimeType =
                      crimeTypes.find((t) => t.id === incident.type) ||
                      crimeTypes[4];

                    return (
                      <div
                        key={incident.id}
                        className="mb-4 p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleViewDetails(incident)}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium">{incident.title}</h3>
                          <Badge variant="outline" style={statusStyle}>
                            {statusTypes.find((s) => s.id === incident.status)
                              ?.label || "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 mb-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {incident.description}
                        </div>
                      </div>
                    );
                  })}
                  {filteredIncidents.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No reports match your search criteria
                    </div>
                  )}
                </ScrollArea>
              </CardContent>{" "}
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const listButton = document.getElementById(
                      "radix-«r2»-trigger-list"
                    );
                    if (listButton) (listButton as HTMLElement).click();
                  }}
                >
                  Click List to view all reports
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>
                  Overview of your reports by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusTypes.map((status) => {
                    const count = incidents.filter(
                      (i) => i.status === status.id
                    ).length;
                    const percentage =
                      incidents.length > 0
                        ? Math.round((count / incidents.length) * 100)
                        : 0;

                    return (
                      <div key={status.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {status.label}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: status.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>{" "}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>
                Comprehensive list of all incidents you have reported
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading your reports...</div>
              ) : filteredIncidents.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date Reported</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncidents.map((incident) => {
                        const crimeType =
                          crimeTypes.find((t) => t.id === incident.type) ||
                          crimeTypes[4];
                        const statusStyle = getStatusBadgeStyles(
                          incident.status
                        );

                        return (
                          <TableRow key={incident.id}>
                            <TableCell className="font-medium">
                              {incident.title}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: `${crimeType.color}20`,
                                  color: crimeType.color,
                                  borderColor: `${crimeType.color}40`,
                                }}
                              >
                                {crimeType.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" style={statusStyle}>
                                {statusTypes.find(
                                  (s) => s.id === incident.status
                                )?.label || "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 shrink-0 text-muted-foreground" />
                                <span className="truncate text-sm">
                                  {incident.address || "Unknown location"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(
                                incident.createdAt
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(incident)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No reports match your search criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Incident Detail Dialog */}
      <IncidentDetailDialog
        incident={selectedIncident}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
