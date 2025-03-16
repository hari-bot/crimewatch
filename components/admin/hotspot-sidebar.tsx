"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { Incident } from "@/types";
import { crimeTypes } from "@/constants/crime-types";
import { getRiskLevelColor } from "@/utils/admin-dashboard-utils";

interface HotspotSidebarProps {
  hotspots: {
    center: [number, number];
    count: number;
    radius: number;
    incidents: Incident[];
    incidentsByType?: Record<string, number>;
    riskLevel?: string;
  }[];
  onHotspotSelect: (center: [number, number], zoom?: number) => void;
  onIncidentSelect: (incident: Incident) => void;
  style?: React.CSSProperties; // Add this line to accept custom styles
}

export default function HotspotSidebar({
  hotspots,
  onHotspotSelect,
  onIncidentSelect,
  style, // Add this line to accept custom styles
}: HotspotSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedHotspotIndex, setSelectedHotspotIndex] = useState<
    number | null
  >(null);
  const [showIncidents, setShowIncidents] = useState(false);

  // Sort hotspots by risk level and count
  const sortedHotspots = [...hotspots].sort((a, b) => {
    // First by risk level (CRITICAL > HIGH > MEDIUM > LOW)
    const riskLevelOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const aRiskValue =
      riskLevelOrder[a.riskLevel as keyof typeof riskLevelOrder] || 4;
    const bRiskValue =
      riskLevelOrder[b.riskLevel as keyof typeof riskLevelOrder] || 4;

    if (aRiskValue !== bRiskValue) {
      return aRiskValue - bRiskValue;
    }

    // Then by incident count (higher first)
    return b.count - a.count;
  });

  const handleHotspotClick = (index: number, center: [number, number]) => {
    setSelectedHotspotIndex(index);
    onHotspotSelect(center, 15); // Zoom level 15
    setShowIncidents(false);
  };

  const handleShowIncidents = (index: number) => {
    setSelectedHotspotIndex(index);
    setShowIncidents(true);
  };

  const handleIncidentClick = (incident: Incident) => {
    onIncidentSelect(incident);
    // Center map on incident
    onHotspotSelect([incident.latitude, incident.longitude], 16);
  };

  if (isCollapsed) {
    return (
      <div className="z-20">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-md"
          onClick={() => setIsCollapsed(false)}
        >
          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="z-20 bg-background border-r shadow-lg h-[600px] w-80 flex flex-col"
      style={style} // Add this line to apply custom styles
    >
      <div className="p-3 border-b flex items-center justify-between bg-muted/50">
        <h3 className="font-bold flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
          Crime Hotspots ({hotspots.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {showIncidents && selectedHotspotIndex !== null ? (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h4 className="font-medium text-sm">
              Incidents in Hotspot (
              {sortedHotspots[selectedHotspotIndex].incidents.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowIncidents(false)}
            >
              Back to Hotspots
            </Button>
          </div>
          <ScrollArea className="flex-1">
            {sortedHotspots[selectedHotspotIndex].incidents.map((incident) => (
              <div
                key={incident.id}
                className="p-3 border-b hover:bg-muted/50 cursor-pointer"
                onClick={() => handleIncidentClick(incident)}
              >
                <div className="font-medium">{incident.title}</div>
                <div className="text-sm text-muted-foreground flex items-center mt-1">
                  <div
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{
                      backgroundColor:
                        crimeTypes.find((t) => t.id === incident.type)?.color ||
                        "#581845",
                    }}
                  ></div>
                  {crimeTypes.find((t) => t.id === incident.type)?.label ||
                    "Other"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(incident.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {sortedHotspots.map((hotspot, index) => (
            <div
              key={index}
              className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                selectedHotspotIndex === index ? "bg-muted/50" : ""
              }`}
            >
              <div
                className="flex items-center justify-between"
                onClick={() => handleHotspotClick(index, hotspot.center)}
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{
                      backgroundColor: getRiskLevelColor(
                        hotspot.riskLevel || "MEDIUM"
                      ),
                    }}
                  ></div>
                  <div>
                    <div className="font-medium">Hotspot #{index + 1}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {hotspot.center[0].toFixed(4)},{" "}
                      {hotspot.center[1].toFixed(4)}
                    </div>
                  </div>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-bold text-white"
                  style={{
                    backgroundColor: getRiskLevelColor(
                      hotspot.riskLevel || "MEDIUM"
                    ),
                  }}
                >
                  {hotspot.riskLevel}
                </div>
              </div>

              <div className="mt-2">
                <div className="text-sm font-medium">Incident Types:</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                  {hotspot.incidentsByType &&
                    Object.entries(hotspot.incidentsByType)
                      .sort((a, b) => b[1] - a[1]) // Sort by count (highest first)
                      .map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex items-center">
                            <span
                              className="w-2 h-2 rounded-full mr-1"
                              style={{
                                backgroundColor:
                                  crimeTypes.find((t) => t.id === type)
                                    ?.color || "#581845",
                              }}
                            ></span>
                            {crimeTypes.find((t) => t.id === type)?.label ||
                              "Other"}
                            :
                          </span>
                          <span>{count}</span>
                        </div>
                      ))}
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm">
                  <span className="font-medium">{hotspot.count}</span> incidents
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShowIncidents(index)}
                >
                  View Incidents
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
    </div>
  );
}
