"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"

interface MapControllerProps {
  center: [number, number]
  zoom: number
  selectedIncident: string | null
  incidents: any[]
}

export default function MapController({ center, zoom, selectedIncident, incidents }: MapControllerProps) {
  const map = useMap()

  // Update map center when center prop changes
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  // Fly to selected incident
  useEffect(() => {
    if (selectedIncident) {
      const incident = incidents.find((inc) => inc.id === selectedIncident)
      if (incident) {
        map.flyTo([incident.latitude, incident.longitude], 15, {
          animate: true,
          duration: 1,
        })
      }
    }
  }, [selectedIncident, incidents, map])

  return null
}

