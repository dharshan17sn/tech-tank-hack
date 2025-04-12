import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { writeFile } from "fs/promises"
import path from "path"

const cropFeedSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  isAiQuery: z.boolean().default(false),
  imageFile: z.any().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    
    // Extract form fields
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const isAiQuery = formData.get('isAiQuery') === 'true'
    const imageFile = formData.get('imageFile') as File | null

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    let imageUrl = null

    // Handle image upload if present
    if (imageFile) {
      const fileExtension = imageFile.name.split('.').pop()
      const uniqueFileName = `${uuidv4()}.${fileExtension}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'crop-feeds')
      const filePath = path.join(uploadDir, uniqueFileName)

      // Convert File to Buffer
      const buffer = Buffer.from(await imageFile.arrayBuffer())

      // Save file to disk
      await writeFile(filePath, buffer)

      // Generate public URL
      imageUrl = `/uploads/crop-feeds/${uniqueFileName}`
    }

    // Generate AI response if requested
    let aiResponse = null
    if (isAiQuery) {
      // In a real application, this would call an AI service
      // For this demo, we'll simulate an AI response
      aiResponse = simulateAIResponse(description)
    }

    // Create crop feed
    const cropFeed = await prisma.cropFeed.create({
      data: {
        title,
        description,
        imageUrl: imageUrl || null,
        isAiQuery,
        aiResponse,
        userId: session.id,
      },
    })

    return NextResponse.json({ message: "Crop feed created successfully", cropFeed }, { status: 201 })
  } catch (error) {
    console.error("Error creating crop feed:", error)
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
    const userId = searchParams.get("userId")

    // Build query
    const where = userId ? { userId } : {}

    // Fetch crop feeds
    const cropFeeds = await prisma.cropFeed.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    })

    return NextResponse.json({ cropFeeds })
  } catch (error) {
    console.error("Error fetching crop feeds:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to simulate AI response
function simulateAIResponse(description: string): string {
  const responses = [
    "Based on your description, this appears to be a case of powdery mildew. I recommend applying a fungicide specifically designed for this issue. Also, ensure proper air circulation around your plants and avoid overhead watering.",
    "The symptoms you're describing suggest a nutrient deficiency, likely nitrogen. Consider applying a balanced fertilizer with higher nitrogen content. Also, check your soil pH as it might be affecting nutrient uptake.",
    "This looks like pest damage, possibly from aphids or spider mites. I recommend using an organic insecticidal soap or neem oil. Apply in the evening to avoid leaf burn and repeat every 7-10 days.",
    "Your crop might be suffering from overwatering. Reduce watering frequency and ensure proper drainage. Check that the soil is dry to about 1 inch depth before watering again.",
    "The symptoms indicate a bacterial or fungal infection. Remove and destroy affected plant parts. Apply a copper-based fungicide and avoid overhead watering to prevent spread.",
  ]

  // Simple logic to pick a response based on keywords in the description
  if (description.toLowerCase().includes("spot") || description.toLowerCase().includes("leaf")) {
    return responses[0]
  } else if (description.toLowerCase().includes("yellow") || description.toLowerCase().includes("pale")) {
    return responses[1]
  } else if (description.toLowerCase().includes("insect") || description.toLowerCase().includes("bite")) {
    return responses[2]
  } else if (description.toLowerCase().includes("water") || description.toLowerCase().includes("wilt")) {
    return responses[3]
  } else {
    return responses[4]
  }
}
