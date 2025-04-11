import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const requestSchema = z.object({
  location: z.string().min(5),
  contactNumber: z.string().min(5),
  additionalInfo: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a farmer
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    })

    if (!user || user.role !== UserRole.FARMER) {
      return NextResponse.json({ error: "Only farmers can request soil tests" }, { status: 403 })
    }

    const body = await req.json()

    // Validate request body
    const validation = requestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input data", details: validation.error.format() }, { status: 400 })
    }

    const { location, contactNumber, additionalInfo } = validation.data

    // Create soil test request
    const request = await prisma.soilTestRequest.create({
      data: {
        location,
        contactNumber,
        farmerId: session.id,
      },
    })

    return NextResponse.json({ message: "Soil test request submitted successfully", request }, { status: 201 })
  } catch (error) {
    console.error("Error creating soil test request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
