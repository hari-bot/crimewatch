"use client";

import type React from "react";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchLocation } from "@/utils/location-utils";

interface LocationSearchProps {
  onLocationFound: (lat: number, lng: number, address: string) => void;
  toast: any;
}

export default function LocationSearch({
  onLocationFound,
  toast,
}: LocationSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = searchInputRef.current?.value;
    if (!searchQuery) return;

    setIsSearching(true);

    try {
      const result = await searchLocation(searchQuery);

      if (result) {
        const { lat, lng, display_name } = result;
        onLocationFound(lat, lng, display_name);

        toast({
          title: "Location found",
          description: `Found location: ${display_name}`,
        });
      } else {
        toast({
          title: "Location not found",
          description: "Could not find the location you searched for",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast({
        title: "Search error",
        description: "An error occurred while searching for the location",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearchLocation} className="flex items-center gap-2">
      <Input
        ref={searchInputRef}
        type="text"
        placeholder="Search for a location"
        className="flex-1"
      />
      <Button type="submit" variant="outline" disabled={isSearching}>
        <Search className="h-4 w-4 mr-2" />
        {isSearching ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
