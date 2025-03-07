import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"
import cloudinary from "cloudinary"

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const lat = Number.parseFloat(searchParams.get("lat") || "0")
    const lng = Number.parseFloat(searchParams.get("lng") || "0")
    const radius = Number.parseInt(searchParams.get("radius") || "2000")

    // If lat and lng are provided, filter by distance
    let incidents

    if (lat && lng && radius) {
      // Calculate bounding box for faster querying
      const latDelta = radius / 111000 // 111000 meters is roughly 1 degree of latitude
      const lngDelta = radius / (111000 * Math.cos(lat * (Math.PI / 180)))

      incidents = await db.incident.findMany({
        where: {
          latitude: {
            gte: lat - latDelta,
            lte: lat + latDelta,
          },
          longitude: {
            gte: lng - lngDelta,
            lte: lng + lngDelta,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      // Further filter by actual distance (Haversine formula)
      incidents = incidents.filter((incident) => {
        const distance = calculateDistance(lat, lng, incident.latitude, incident.longitude)

        return distance <= radius
      })
    } else {
      // If no location provided, just return all incidents
      incidents = await db.incident.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })
    }

    return NextResponse.json(incidents)
  } catch (error) {
    console.error("Error fetching incidents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle multipart form data
    const formData = await request.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const type = formData.get("type") as string
    const latitude = Number.parseFloat(formData.get("latitude") as string)
    const longitude = Number.parseFloat(formData.get("longitude") as string)
    const address = formData.get("address") as string
    const image = formData.get("image") as File

    // Validate required fields
    if (!title || !description || !type || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle image upload to Cloudinary if provided
    let imageUrl = null

    if (image) {
      const arrayBuffer = await image.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Cloudinary
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream(
          { folder: "crime-images" }, // Store images in a specific folder
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      })

      if (!uploadResponse || !uploadResponse.secure_url) {
        console.error("Error uploading image to Cloudinary")
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
      }

      imageUrl = uploadResponse.secure_url // Get the public URL
    }

    // Create incident in the database
    const incident = await db.incident.create({
      data: {
        title,
        description,
        type,
        latitude,
        longitude,
        address,
        imageUrl,
        status: "pending", // Default status
        userId: session.user.id,
      },
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    console.error("Error creating incident:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

