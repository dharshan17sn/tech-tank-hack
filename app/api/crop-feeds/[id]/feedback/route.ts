import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cropFeedId = params.id

    // Check if crop feed exists and belongs to the user
    const cropFeed = await prisma.cropFeed.findUnique({
      where: { id: cropFeedId },
    })

    if (!cropFeed) {
      return NextResponse.json({ error: "Crop feed not found" }, { status: 404 })
    }

    if (cropFeed.userId !== session.id) {
      return NextResponse.json({ error: "You can only provide feedback on your own posts" }, { status: 403 })
    }

    // Get form data
    const formData = await req.formData()
    const helpfulStr = formData.get("helpful")

    if (typeof helpfulStr !== "string") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    const wasHelpful = helpfulStr === "true"

    // Update crop feed with feedback
    const updatedCropFeed = await prisma.cropFeed.update({
      where: { id: cropFeedId },
      data: { wasHelpful },
    })

    return NextResponse.json({ message: "Feedback recorded successfully", cropFeed: updatedCropFeed }, { status: 200 })
  } catch (error) {
    console.error("Error recording feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
