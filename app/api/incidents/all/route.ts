import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all incidents
    const incidents = await db.incident.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(incidents)
  } catch (error) {
    console.error("Error fetching all incidents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

