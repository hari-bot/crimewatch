"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Calendar } from "lucide-react";
import type { Incident } from "@/types";
import { crimeTypes } from "@/constants/crime-types";
import { cn } from "@/lib/utils";

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
  const crimeType =
    crimeTypes.find((t) => t.id === incident.type) || crimeTypes[4];

  return (
    <Card
      className={cn(
        "w-72 shrink-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden mt-5",
        isSelected ? "ring-2 ring-primary scale-[1.02]" : ""
      )}
      onClick={onClick}
    >
      {incident.imageUrl && (
        <div className="w-full h-32 relative">
          <img
            src={incident.imageUrl || "/placeholder.svg"}
            alt={incident.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(to bottom, transparent 50%, ${crimeType.color}90 100%)`,
            }}
          ></div>
        </div>
      )}
      <CardContent className={cn("p-4 pb-2", !incident.imageUrl && "pt-4")}>
        <div className="flex items-start gap-2 mb-2">
          <Badge
            variant="outline"
            className="shrink-0"
            style={{
              backgroundColor: `${crimeType.color}20`,
              color: crimeType.color,
              borderColor: `${crimeType.color}40`,
            }}
          >
            {crimeType.label}
          </Badge>
          <h3 className="font-medium text-sm leading-tight">
            {incident.title}
          </h3>
        </div>
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
          <span className="line-clamp-2">
            {incident.address || "Unknown location"}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between items-center">
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(incident.createdAt).toLocaleDateString()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-primary/10 hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}
