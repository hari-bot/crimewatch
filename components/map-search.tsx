"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface MapSearchProps {
  onLocationFound: (lat: number, lng: number) => void
}

export default function MapSearch({ onLocationFound }: MapSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setIsSearching(true)

    try {
      // Use OpenStreetMap Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
      )

      if (!response.ok) {
        throw new Error("Failed to search location")
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        const latitude = Number.parseFloat(lat)
        const longitude = Number.parseFloat(lon)

        onLocationFound(latitude, longitude)
        toast({
          title: "Location found",
          description: `Found: ${data[0].display_name}`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "No results found",
          description: "Try a different search term",
        })
      }
    } catch (error) {
      console.error("Error searching location:", error)
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Could not search for this location",
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search location..."
        className="pl-8 pr-20"
      />
      <Button type="submit" size="sm" className="absolute right-0 top-0 h-full rounded-l-none" disabled={isSearching}>
        {isSearching ? "Searching..." : "Search"}
      </Button>
    </form>
  )
}

