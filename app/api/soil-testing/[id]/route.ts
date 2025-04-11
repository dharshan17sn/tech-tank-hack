import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestId = params.id

    // Fetch user to determine role
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch the soil test request
    const request = await prisma.soilTestRequest.findUnique({
      where: { id: requestId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reports: true,
      },
    })

    if (!request) {
      return NextResponse.json({ error: "Soil test request not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role === UserRole.FARMER && request.farmerId !== session.id) {
      return NextResponse.json({ error: "You do not have permission to view this request" }, { status: 403 })
    }

    if (user.role === UserRole.SOIL_TEST_COMPANY && request.status !== "PENDING" && request.status !== "ACCEPTED") {
      // Check if this company has already submitted a report for this request
      const existingReport = await prisma.soilTestReport.findFirst({
        where: {
          requestId,
          soilTesterId: session.id,
        },
      })

      if (!existingReport) {
        return NextResponse.json({ error: "You do not have permission to view this request" }, { status: 403 })
      }
    }

    return NextResponse.json({ request })
  } catch (error) {
    console.error("Error fetching soil test request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
