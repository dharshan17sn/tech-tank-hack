import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const marketPriceSchema = z.object({
  cropName: z.string().min(2),
  marketName: z.string().min(2),
  price: z.number().positive(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Please enter a valid date" }),
  cropType: z.enum(["SHORT_TERM", "SEASONAL", "LONG_TERM"]),
  imageUrl: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a market agent
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    })

    if (!user || user.role !== UserRole.MARKET_AGENT) {
      return NextResponse.json({ error: "Only market agents can add prices" }, { status: 403 })
    }

    const body = await req.json()

    // Validate request body
    const validation = marketPriceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input data", details: validation.error.format() }, { status: 400 })
    }

    const { cropName, marketName, price, date, cropType, imageUrl } = validation.data

    // Create market price
    const marketPrice = await prisma.marketPrice.create({
      data: {
        cropName,
        marketName,
        price,
        date: new Date(date),
        cropType,
        imageUrl: imageUrl || null,
        agentId: session.id,
      },
    })

    return NextResponse.json({ message: "Market price added successfully", marketPrice }, { status: 201 })
  } catch (error) {
    console.error("Error adding market price:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const cropName = searchParams.get("cropName")
    const cropType = searchParams.get("cropType")
    const marketName = searchParams.get("marketName")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    // Build query
    const where: any = {}

    if (cropName) {
      where.cropName = cropName
    }

    if (cropType) {
      where.cropType = cropType
    }

    if (marketName) {
      where.marketName = marketName
    }

    if (fromDate || toDate) {
      where.date = {}

      if (fromDate) {
        where.date.gte = new Date(fromDate)
      }

      if (toDate) {
        where.date.lte = new Date(toDate)
      }
    }

    // Fetch market prices
    const marketPrices = await prisma.marketPrice.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        agent: {
          select: {
            id: true,
            companyName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ marketPrices })
  } catch (error) {
    console.error("Error fetching market prices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
