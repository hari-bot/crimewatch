"use client";

import type React from "react";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { crimeTypes } from "@/constants/crime-types";
import { searchLocation } from "@/utils/location-utils";

interface FilterSidebarProps {
  selectedTypes: string[];
  onTypeChange: (typeId: string) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onLocationSearch: (lat: number, lng: number) => void;
}

export default function FilterSidebar({
  selectedTypes,
  onTypeChange,
  radius,
  onRadiusChange,
  onLocationSearch,
}: FilterSidebarProps) {
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchInput = e.currentTarget.querySelector("input")?.value;
    if (searchInput) {
      try {
        const result = await searchLocation(searchInput);
        if (result) {
          onLocationSearch(result.lat, result.lng);
        }
      } catch (error) {
        console.error("Error searching location:", error);
      }
    }
  };

  return (
    <div className="w-full md:w-80 bg-background border-r p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">CrimeWatch</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <form onSubmit={handleSearch}>
          <Input placeholder="Search location..." className="pl-8" />
        </form>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Select Crime Type</h2>
        <div className="grid grid-cols-2 gap-2">
          {crimeTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <Checkbox
                id={type.id}
                checked={selectedTypes.includes(type.id)}
                onCheckedChange={() => onTypeChange(type.id)}
              />
              <Label htmlFor={type.id} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: type.color }}
                ></div>
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Select Radius (In Meter)</h2>
        <Slider
          value={[radius]}
          min={500}
          max={5000}
          step={500}
          onValueChange={(value) => onRadiusChange(value[0])}
        />
        <p className="text-sm text-muted-foreground mt-1">{radius} meters</p>
      </div>

      <Button className="w-full" asChild>
        <Link href="/report">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report Crime
        </Link>
      </Button>
    </div>
  );
}
