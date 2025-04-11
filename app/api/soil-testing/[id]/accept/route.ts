import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a soil testing company
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    })

    if (!user || user.role !== UserRole.SOIL_TEST_COMPANY) {
      return NextResponse.json({ error: "Only soil testing companies can accept requests" }, { status: 403 })
    }

    const requestId = params.id

    // Check if request exists and is pending
    const request = await prisma.soilTestRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      return NextResponse.json({ error: "Soil test request not found" }, { status: 404 })
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "This request has already been accepted" }, { status: 400 })
    }

    // Update request status to ACCEPTED
    const updatedRequest = await prisma.soilTestRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    })

    return NextResponse.json(
      { message: "Soil test request accepted successfully", request: updatedRequest },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error accepting soil test request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
