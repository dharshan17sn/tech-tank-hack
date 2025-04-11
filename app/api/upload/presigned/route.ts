import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { generatePresignedUrl } from "@/lib/s3"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

const presignedUrlSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  folder: z.string(),
})

export async function POST(req: NextRequest) {

  console.log("getting to the upload ...");
  
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate request body
    const validation = presignedUrlSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input data", details: validation.error.format() }, { status: 400 })
    }

    const { fileName, contentType, folder } = validation.data

    // Generate a unique file name to prevent collisions
    const fileExtension = fileName.split(".").pop()
    const uniqueFileName = `${folder}/${session.id}/${uuidv4()}.${fileExtension}`

    // Generate presigned URL
    const { uploadUrl, publicUrl } = await generatePresignedUrl(uniqueFileName, contentType)

    console.log(uploadUrl);
    
    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
