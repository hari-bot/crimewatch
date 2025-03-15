"\"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Incident } from "@/types";

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
  if (!incident) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{incident.title}</DialogTitle>
          <DialogDescription>{incident.description}</DialogDescription>
        </DialogHeader>
        {/* Add more incident details here */}
        <p>Type: {incident.type}</p>
        <p>Status: {incident.status}</p>
        <p>Location: {incident.address}</p>
      </DialogContent>
    </Dialog>
  );
}
