import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

export async function generatePresignedUrl(key: string, contentType: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  try {
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    })

    // Return both the signed URL for upload and the public URL for later access

    console.log(signedUrl);
    

    return {
      uploadUrl: signedUrl,
      publicUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
    }
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    throw error
  }
}
