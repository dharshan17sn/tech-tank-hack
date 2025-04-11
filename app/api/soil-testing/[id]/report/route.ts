import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const reportSchema = z.object({
  reportUrl: z.string().url(),
  soilCollectionUrl: z.string().url(),
  farmerPhotoUrl: z.string().url(),
})

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
      return NextResponse.json({ error: "Only soil testing companies can submit reports" }, { status: 403 })
    }

    const requestId = params.id

    // Check if request exists and is accepted
    const request = await prisma.soilTestRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      return NextResponse.json({ error: "Soil test request not found" }, { status: 404 })
    }

    if (request.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "You must first accept this request before submitting a report" },
        { status: 400 },
      )
    }

    const body = await req.json()

    // Validate request body
    const validation = reportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input data", details: validation.error.format() }, { status: 400 })
    }

    const { reportUrl, soilCollectionUrl, farmerPhotoUrl } = validation.data

    // Create soil test report
    const report = await prisma.soilTestReport.create({
      data: {
        reportUrl,
        soilCollectionUrl,
        farmerPhotoUrl,
        requestId,
        soilTesterId: session.id,
      },
    })

    // Update request status to COMPLETED
    await prisma.soilTestRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
    })

    // Increase KrishiStars for the soil testing company
    await prisma.user.update({
      where: { id: session.id },
      data: { krishiStars: { increment: 5 } },
    })

    return NextResponse.json({ message: "Soil test report submitted successfully", report }, { status: 201 })
  } catch (error) {
    console.error("Error submitting soil test report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
