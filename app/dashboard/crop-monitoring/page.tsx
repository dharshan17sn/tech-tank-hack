"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  cropImage: z.any().refine((files) => files?.length === 1, "Crop image is required"),
})

export default function CropMonitoringPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      // Upload image
      setIsUploading(true)
      const cropImageFile = values.cropImage[0]

      // Get a pre-signed URL from the server
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: cropImageFile.name,
          contentType: cropImageFile.type,
          folder: "crop-monitoring",
        }),
      })

      if (!presignedRes.ok) {
        throw new Error("Failed to get upload URL")
      }

      const { uploadUrl, publicUrl } = await presignedRes.json()

      // Upload the file directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: cropImageFile,
        headers: {
          "Content-Type": cropImageFile.type,
        },
      })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image")
      }

      setIsUploading(false)

      // Create the crop feed with AI query flag
      const response = await fetch("/api/crop-feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          imageUrl: publicUrl,
          isAiQuery: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit crop monitoring request")
      }

      router.push(`/dashboard/crop-feeds/${data.cropFeed.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit crop monitoring request")
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Crop Monitoring with AI</h1>

        <Card>
          <CardHeader>
            <CardTitle>Submit Crop for Analysis</CardTitle>
            <CardDescription>
              Upload a photo of your crop and describe any issues or questions you have. Our AI will analyze it and
              provide suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Yellow spots on rice leaves" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your crop issue or question in detail..."
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include details like crop age, symptoms, when you first noticed the issue, etc.
                      </FormDescription>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cropImage"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Crop Image</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-green-500 transition-colors">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onChange(e.target.files)}
                            className="hidden"
                            id="cropImage"
                            {...field}
                          />
                          <label
                            htmlFor="cropImage"
                            className="flex flex-col items-center justify-center cursor-pointer"
                          >
                            <Upload className="h-10 w-10 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                              {value && value[0] ? value[0].name : "Click to upload or drag and drop"}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</span>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? "Uploading image..." : "Submitting..."}
                    </>
                  ) : (
                    "Submit for AI Analysis"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
