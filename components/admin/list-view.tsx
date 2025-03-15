"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { crimeTypes, statusTypes } from "@/constants/incident-types";
import type { Incident } from "@/types";

interface ListViewProps {
  loading: boolean;
  filteredIncidents: Incident[];
  setSelectedIncident: (incident: Incident) => void;
  updateIncidentStatus: (id: string, status: string) => void;
  deleteIncident: (id: string) => void;
}

export default function ListView({
  loading,
  filteredIncidents,
  setSelectedIncident,
  updateIncidentStatus,
  deleteIncident,
}: ListViewProps) {
  return (
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
                      {crimeTypes.find((t) => t.id === incident.type)?.label ||
                        "Other"}
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
                        incident.status === "resolved" ? "default" : "outline"
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
                            <DialogTitle>Update Incident Status</DialogTitle>
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
                              Are you sure you want to delete this incident?
                              This action cannot be undone.
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
  );
}
