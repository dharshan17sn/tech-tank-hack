import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const commentSchema = z.object({
  content: z.string().min(1),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cropFeedId = params.id

    // Check if crop feed exists
    const cropFeed = await prisma.cropFeed.findUnique({
      where: { id: cropFeedId },
    })

    if (!cropFeed) {
      return NextResponse.json({ error: "Crop feed not found" }, { status: 404 })
    }

    const body = await req.json()

    // Validate request body
    const validation = commentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input data", details: validation.error.format() }, { status: 400 })
    }

    const { content } = validation.data

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        cropFeedId,
        userId: session.id,
      },
    })

    return NextResponse.json({ message: "Comment added successfully", comment }, { status: 201 })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cropFeedId = params.id

    // Check if crop feed exists
    const cropFeed = await prisma.cropFeed.findUnique({
      where: { id: cropFeedId },
    })

    if (!cropFeed) {
      return NextResponse.json({ error: "Crop feed not found" }, { status: 404 })
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where: { cropFeedId },
      orderBy: { createdAt: "asc" },
      include: {
        cropFeed: {
          select: {
            userId: true,
          },
        },
      },
    })

    // Fetch comment authors
    const commentUserIds = comments.map((comment) => comment.userId)
    const commentUsers = await prisma.user.findMany({
      where: {
        id: {
          in: commentUserIds,
        },
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
      },
    })

    // Map users to comments
    const commentsWithUsers = comments.map((comment) => {
      const user = commentUsers.find((u) => u.id === comment.userId)
      return {
        ...comment,
        user,
      }
    })

    return NextResponse.json({ comments: commentsWithUsers })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
