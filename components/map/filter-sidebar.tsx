"use client";

import type React from "react";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { crimeTypes } from "@/constants/crime-types";
import { searchLocation } from "@/utils/location-utils";
import { Switch } from "@/components/ui/switch";

interface FilterSidebarProps {
  selectedTypes: string[];
  onTypeChange: (typeId: string) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onLocationSearch: (lat: number, lng: number) => void;
  isOpen: boolean;
  onClose: () => void;
  showCarousel: boolean;
  onToggleCarousel: () => void;
}

export default function FilterSidebar({
  selectedTypes,
  onTypeChange,
  radius,
  onRadiusChange,
  onLocationSearch,
  isOpen,
  onClose,
  showCarousel,
  onToggleCarousel,
}: FilterSidebarProps) {
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchInput = e.currentTarget.querySelector("input")?.value;
    if (searchInput) {
      try {
        const result = await searchLocation(searchInput);
        if (result) {
          onLocationSearch(result.lat, result.lng);
          if (window.innerWidth < 768) {
            onClose(); // Close sidebar on mobile after search
          }
        }
      } catch (error) {
        console.error("Error searching location:", error);
      }
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-background/95 backdrop-blur-sm border-r shadow-lg transition-transform duration-300 ease-in-out transform md:translate-x-0 md:static md:w-80 md:min-h-screen overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-sm font-medium mb-2">Search Location</h2>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Enter address or place..." className="pl-9" />
            </form>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-sm font-medium mb-3">Crime Types</h2>
            <div className="grid grid-cols-1 gap-2">
              {crimeTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={() => onTypeChange(type.id)}
                  />
                  <Label
                    htmlFor={`type-${type.id}`}
                    className="flex items-center text-sm cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: type.color }}
                    ></div>
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">Search Radius</h2>
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                {radius}m
              </span>
            </div>
            <Slider
              value={[radius]}
              min={500}
              max={5000}
              step={500}
              onValueChange={(value) => onRadiusChange(value[0])}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>500m</span>
              <span>5000m</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Incident Carousel</h2>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="show-carousel"
                  className="text-sm cursor-pointer"
                >
                  {showCarousel ? "Visible" : "Hidden"}
                </Label>
                <Switch
                  id="show-carousel"
                  checked={showCarousel}
                  onCheckedChange={onToggleCarousel}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" asChild>
          <Link href="/report">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Crime
          </Link>
        </Button>
      </div>
    </div>
  );
}
