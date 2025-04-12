import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { z } from "zod"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"

const reportSchema = z.object({
  reportFile: z.any(),
  soilCollectionFile: z.any(),
  farmerPhotoFile: z.any(),
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

    const formData = await req.formData()
    const reportFile = formData.get("reportFile") as File
    const soilCollectionFile = formData.get("soilCollectionFile") as File
    const farmerPhotoFile = formData.get("farmerPhotoFile") as File

    if (!reportFile || !soilCollectionFile || !farmerPhotoFile) {
      return NextResponse.json({ error: "All files are required" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filenames
    const reportFileName = `${requestId}-report-${Date.now()}.${reportFile.name.split(".").pop()}`
    const soilCollectionFileName = `${requestId}-soil-${Date.now()}.${soilCollectionFile.name.split(".").pop()}`
    const farmerPhotoFileName = `${requestId}-farmer-${Date.now()}.${farmerPhotoFile.name.split(".").pop()}`

    // Save files to server
    const reportBuffer = Buffer.from(await reportFile.arrayBuffer())
    const soilCollectionBuffer = Buffer.from(await soilCollectionFile.arrayBuffer())
    const farmerPhotoBuffer = Buffer.from(await farmerPhotoFile.arrayBuffer())

    await Promise.all([
      writeFile(join(uploadsDir, reportFileName), reportBuffer),
      writeFile(join(uploadsDir, soilCollectionFileName), soilCollectionBuffer),
      writeFile(join(uploadsDir, farmerPhotoFileName), farmerPhotoBuffer),
    ])

    // Create soil test report
    const report = await prisma.soilTestReport.create({
      data: {
        reportUrl: `/uploads/${reportFileName}`,
        soilCollectionUrl: `/uploads/${soilCollectionFileName}`,
        farmerPhotoUrl: `/uploads/${farmerPhotoFileName}`,
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
