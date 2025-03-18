"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselToggleProps {
  showCarousel: boolean;
  onToggleCarousel: () => void;
  className?: string;
}

export default function CarouselToggle({
  showCarousel,
  onToggleCarousel,
  className,
}: CarouselToggleProps) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onToggleCarousel}
      className={cn(
        "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md px-3 mb-5 py-1 h-auto bg-background/90 backdrop-blur-sm hover:bg-background/95 border",
        className
      )}
      aria-label={
        showCarousel ? "Hide incident carousel" : "Show incident carousel"
      }
    >
      {showCarousel ? (
        <>
          <ChevronDown className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Hide Incidents</span>
        </>
      ) : (
        <>
          <ChevronUp className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Show Incidents</span>
        </>
      )}
    </Button>
  );
}
