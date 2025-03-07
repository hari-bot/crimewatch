"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { Incident } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, MapPin, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Define crime types with their respective colors
const crimeTypes = [
  { id: "theft", label: "Theft", color: "#FF5733" },
  { id: "assault", label: "Assault", color: "#C70039" },
  { id: "vandalism", label: "Vandalism", color: "#FFC300" },
  { id: "burglary", label: "Burglary", color: "#900C3F" },
  { id: "other", label: "Other", color: "#581845" },
]

// Define status types
const statusTypes = [
  { id: "pending", label: "Pending", icon: Clock },
  { id: "investigating", label: "Investigating", icon: Search },
  { id: "resolved", label: "Resolved", icon: CheckCircle },
  { id: "dismissed", label: "Dismissed", icon: Trash2 },
]

export default function AdminDashboard() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/incidents")
      const data = await response.json()
      setIncidents(data)
    } catch (error) {
      console.error("Error fetching incidents:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load incidents",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateIncidentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/incidents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      // Update local state
      setIncidents(incidents.map((incident) => (incident.id === id ? { ...incident, status } : incident)))

      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident({ ...selectedIncident, status })
      }

      toast({
        title: "Status updated",
        description: `Incident status has been updated to ${status}`,
      })
    } catch (error) {
      console.error("Error updating incident status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update incident status",
      })
    }
  }

  const deleteIncident = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/incidents/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete incident")
      }

      // Update local state
      setIncidents(incidents.filter((incident) => incident.id !== id))

      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident(null)
      }

      toast({
        title: "Incident deleted",
        description: "The incident has been permanently deleted",
      })
    } catch (error) {
      console.error("Error deleting incident:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete incident",
      })
    }
  }

  // Filter incidents based on status, type, and search query
  const filteredIncidents = incidents.filter((incident) => {
    const matchesStatus = statusFilter === "all" || incident.status === statusFilter
    const matchesType = typeFilter === "all" || incident.type === typeFilter
    const matchesSearch =
      searchQuery === "" ||
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.address.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesType && matchesSearch
  })

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
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
              <CardDescription>Manage and update the status of reported incidents</CardDescription>
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
                        <TableCell className="font-medium">{incident.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {crimeTypes.find((t) => t.id === incident.type)?.label || "Other"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{incident.address || "Unknown location"}</TableCell>
                        <TableCell>{new Date(incident.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={incident.status === "resolved" ? "default" : "outline"}
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
                            {statusTypes.find((s) => s.id === incident.status)?.label || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(incident)}>
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
                                  <DialogTitle>Update Incident Status</DialogTitle>
                                  <DialogDescription>Change the status of this incident</DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Select
                                    defaultValue={incident.status}
                                    onValueChange={(value) => updateIncidentStatus(incident.id, value)}
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
                                    Are you sure you want to delete this incident? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {}}>
                                    Cancel
                                  </Button>
                                  <Button variant="destructive" onClick={() => deleteIncident(incident.id)}>
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
                <div className="text-center py-8 text-muted-foreground">No incidents found matching your filters</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px] relative w-full">
               <div className="inset-0 absolute z-10">
               <MapContainer
                  center={[35.5951, -80.8104]} // Default center
                  zoom={10}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {filteredIncidents.map((incident) => (
                    <Marker key={incident.id} position={[incident.latitude, incident.longitude]}>
                      <Popup>
                        <div className="w-64">
                          <h3 className="font-bold">{incident.title}</h3>
                          <div className="flex items-center gap-2 my-1">
                            <Badge variant="outline">
                              {crimeTypes.find((t) => t.id === incident.type)?.label || "Other"}
                            </Badge>
                            <Badge
                              variant={incident.status === "resolved" ? "default" : "outline"}
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
                              {statusTypes.find((s) => s.id === incident.status)?.label || "Pending"}
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
                            Reported on {new Date(incident.createdAt).toLocaleDateString()}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedIncident(incident)}>
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
      </Tabs>

      {/* Incident Detail Sidebar */}
      {selectedIncident && (
        <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg p-6 overflow-y-auto z-50">
          <div className="sticky top-0 bg-background pt-2 pb-4 flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Incident Details</h2>
            <Button variant="outline" size="sm" onClick={() => setSelectedIncident(null)} className="ml-2">
              Close
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">{selectedIncident.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {crimeTypes.find((t) => t.id === selectedIncident.type)?.label || "Other"}
                </Badge>
                <Badge
                  variant={selectedIncident.status === "resolved" ? "default" : "outline"}
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
                  {statusTypes.find((s) => s.id === selectedIncident.status)?.label || "Pending"}
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
                  center={[selectedIncident.latitude, selectedIncident.longitude]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[selectedIncident.latitude, selectedIncident.longitude]} />
                </MapContainer>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-1">Reported By</h4>
              <p className="text-sm">{selectedIncident.user?.name || "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">
                on {new Date(selectedIncident.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Update Status</h4>
              <Select
                value={selectedIncident.status}
                onValueChange={(value) => updateIncidentStatus(selectedIncident.id, value)}
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
                    if (confirm("Are you sure you want to delete this incident?")) {
                      deleteIncident(selectedIncident.id)
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
    </div>
  )
}

