import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { status } = await request.json()

    // Update incident status
    const updatedIncident = await db.incident.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updatedIncident)
  } catch (error) {
    console.error("Error updating incident:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get incident to check if it has an image
    const incident = await db.incident.findUnique({
      where: { id },
    })

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    // Delete image from Supabase if exists
    if (incident.imageUrl) {
      const fileName = incident.imageUrl.split("/").pop()
      if (fileName) {
        await supabase.storage.from("crime-images").remove([fileName])
      }
    }

    // Delete incident from database
    await db.incident.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting incident:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

