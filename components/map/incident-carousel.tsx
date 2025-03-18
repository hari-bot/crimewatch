"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import IncidentCard from "./incident-card";
import CarouselToggle from "./corousel-toggle";
import type { Incident } from "@/types";

interface IncidentCarouselProps {
  incidents: Incident[];
  selectedIncident: string | null;
  onCardClick: (incident: Incident) => void;
  onViewDetails: (incident: Incident) => void;
  showCarousel: boolean;
  onToggleCarousel: () => void;
}

export default function IncidentCarousel({
  incidents,
  selectedIncident,
  onCardClick,
  onViewDetails,
  showCarousel,
  onToggleCarousel,
}: IncidentCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to selected incident
  useEffect(() => {
    if (selectedIncident && scrollContainerRef.current) {
      const selectedCard = scrollContainerRef.current.querySelector(
        `[data-id="${selectedIncident}"]`
      );
      if (selectedCard) {
        selectedCard.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedIncident]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.clientWidth * 0.8;
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  // If carousel is hidden, just return the toggle button
  if (!showCarousel) {
    return (
      <div className="flex justify-center">
        <CarouselToggle
          showCarousel={showCarousel}
          onToggleCarousel={onToggleCarousel}
        />
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="w-full text-center py-4 px-6 bg-background/80 backdrop-blur-sm rounded-lg shadow-md relative">
        <CarouselToggle
          showCarousel={showCarousel}
          onToggleCarousel={onToggleCarousel}
        />
        No incidents found in this area. Try adjusting your filters or search
        radius.
      </div>
    );
  }

  return (
    <div className="relative group">
      <CarouselToggle
        showCarousel={showCarousel}
        onToggleCarousel={onToggleCarousel}
      />

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 pb-2 px-4 hide-scrollbar snap-x snap-mandatory"
      >
        {incidents.map((incident) => (
          <div key={incident.id} data-id={incident.id} className="snap-center">
            <IncidentCard
              incident={incident}
              isSelected={selectedIncident === incident.id}
              onClick={() => onCardClick(incident)}
              onViewDetails={() => onViewDetails(incident)}
            />
          </div>
        ))}
      </div>

      {incidents.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
