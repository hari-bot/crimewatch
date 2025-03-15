// Utility functions for handling location data

/**
 * Fetches address information from coordinates using OpenStreetMap's Nominatim service
 */
export async function fetchAddressFromCoordinates(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || null;
  } catch (err) {
    console.error("Error getting address:", err);
    return null;
  }
}

/**
 * Searches for a location by name using OpenStreetMap's Nominatim service
 */
export async function searchLocation(
  query: string
): Promise<{ lat: number; lng: number; display_name: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`
    );

    if (!response.ok) {
      throw new Error("Failed to search location");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0];
      return {
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lon),
        display_name,
      };
    }

    return null;
  } catch (error) {
    console.error("Error searching location:", error);
    return null;
  }
}

/**
 * Convert degrees, minutes, seconds to decimal degrees
 */
export function convertToDecimalDegrees(dms: number[]): number {
  return dms[0] + dms[1] / 60 + dms[2] / 3600;
}
