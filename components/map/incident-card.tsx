"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye } from "lucide-react";
import type { Incident } from "@/types";
import { crimeTypes } from "@/constants/crime-types";

interface IncidentCardProps {
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
  onViewDetails: () => void;
}

export default function IncidentCard({
  incident,
  isSelected,
  onClick,
  onViewDetails,
}: IncidentCardProps) {
  return (
    <Card
      className={`inline-block w-72 shrink-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      {incident.imageUrl && (
        <div className="w-full h-32 relative">
          <img
            src={incident.imageUrl || "/placeholder.svg"}
            alt={incident.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base truncate">{incident.title}</CardTitle>
        <CardDescription className="flex items-center text-xs break-words whitespace-normal">
          <MapPin className="h-3 w-3 mr-1" />
          {incident.address || "Unknown location"}
        </CardDescription>
      </CardHeader>
      <CardFooter className="p-4 pt-2 flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
          <Badge
            variant="outline"
            style={{
              backgroundColor:
                crimeTypes.find((t) => t.id === incident.type)?.color + "20",
              color: crimeTypes.find((t) => t.id === incident.type)?.color,
            }}
          >
            {crimeTypes.find((t) => t.id === incident.type)?.label || "Other"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(incident.createdAt).toLocaleDateString()}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
        >
          <Eye className="h-3 w-3 mr-1" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
