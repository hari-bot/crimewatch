import type { Incident } from "@/types";

// Calculate distance between two points in km using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Function to calculate hotspots
export function calculateHotspots(incidents: Incident[]) {
  // Group incidents by proximity
  const hotspots: {
    center: [number, number];
    count: number;
    radius: number;
  }[] = [];

  // Process each incident
  incidents.forEach((incident) => {
    const incidentLocation: [number, number] = [
      incident.latitude,
      incident.longitude,
    ];

    // Check if this incident is near an existing hotspot
    let addedToHotspot = false;
    for (const hotspot of hotspots) {
      // Calculate distance between incident and hotspot center
      const distance = calculateDistance(
        incidentLocation[0],
        incidentLocation[1],
        hotspot.center[0],
        hotspot.center[1]
      );

      // If within 1km, add to this hotspot
      if (distance < 1) {
        hotspot.count += 1;
        // Recalculate center as average of all points (simplified approach)
        hotspot.center = [
          (hotspot.center[0] * (hotspot.count - 1) + incidentLocation[0]) /
            hotspot.count,
          (hotspot.center[1] * (hotspot.count - 1) + incidentLocation[1]) /
            hotspot.count,
        ];
        // Adjust radius based on count (more incidents = larger radius)
        hotspot.radius = Math.min(500 + hotspot.count * 100, 2000);
        addedToHotspot = true;
        break;
      }
    }

    // If not added to any existing hotspot, create a new one
    if (!addedToHotspot) {
      hotspots.push({
        center: incidentLocation,
        count: 1,
        radius: 500, // Base radius in meters
      });
    }
  });

  // Filter out hotspots with only 1 incident
  return hotspots.filter((hotspot) => hotspot.count > 1);
}

// Function to format date for grouping
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

// Function to get month name
export function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month];
}

// Function to export analytics data as CSV
export function exportAnalyticsCSV(incidents: Incident[], toast: any) {
  if (!incidents.length) return;

  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,";

  // Headers
  csvContent +=
    "ID,Title,Type,Status,Latitude,Longitude,Address,Created At,Updated At\n";

  // Data rows
  incidents.forEach((incident) => {
    const row = [
      incident.id,
      `"${incident.title.replace(/"/g, '""')}"`,
      incident.type,
      incident.status,
      incident.latitude,
      incident.longitude,
      `"${(incident.address || "").replace(/"/g, '""')}"`,
      new Date(incident.createdAt).toISOString(),
      new Date(incident.updatedAt).toISOString(),
    ];
    csvContent += row.join(",") + "\n";
  });

  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `crime_incidents_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);

  // Trigger download
  link.click();
  document.body.removeChild(link);

  toast({
    title: "Export successful",
    description: `Exported ${incidents.length} incidents to CSV file.`,
  });
}
