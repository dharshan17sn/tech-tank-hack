"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  reportFile: z.any().refine((file) => file?.length === 1, "Soil report file is required"),
  soilCollectionFile: z.any().refine((file) => file?.length === 1, "Soil collection photo is required"),
  farmerPhotoFile: z.any().refine((file) => file?.length === 1, "Photo with farmer is required"),
})

export default function UploadSoilReportPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestDetails, setRequestDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  useEffect(() => {
    async function fetchRequestDetails() {
      try {
        const response = await fetch(`/api/soil-testing/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch request details")
        }

        const data = await response.json()
        setRequestDetails(data.request)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch request details")
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchRequestDetails()
  }, [params.id])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      // Upload each file and get URLs
      const reportFile = values.reportFile[0]
      const soilCollectionFile = values.soilCollectionFile[0]
      const farmerPhotoFile = values.farmerPhotoFile[0]

      // Get presigned URLs for each file
      const [reportUrlData, soilCollectionUrlData, farmerPhotoUrlData] = await Promise.all([
        getPresignedUrl(reportFile, "soil-reports"),
        getPresignedUrl(soilCollectionFile, "soil-collection-photos"),
        getPresignedUrl(farmerPhotoFile, "farmer-photos"),
      ])

      // Upload files to S3
      await Promise.all([
        uploadFileToS3(reportFile, reportUrlData.uploadUrl),
        uploadFileToS3(soilCollectionFile, soilCollectionUrlData.uploadUrl),
        uploadFileToS3(farmerPhotoFile, farmerPhotoUrlData.uploadUrl),
      ])

      // Submit report data to API
      const response = await fetch(`/api/soil-testing/${params.id}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportUrl: reportUrlData.publicUrl,
          soilCollectionUrl: soilCollectionUrlData.publicUrl,
          farmerPhotoUrl: farmerPhotoUrlData.publicUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit soil test report")
      }

      router.push("/dashboard/soil-testing")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit soil test report")
      setIsLoading(false)
    }
  }

  async function getPresignedUrl(file: File, folder: string) {
    const presignedRes = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        folder,
      }),
    })

    if (!presignedRes.ok) {
      throw new Error("Failed to get upload URL")
    }

    return presignedRes.json()
  }

  async function uploadFileToS3(file: File, uploadUrl: string) {
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    })

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload ${file.name}`)
    }

    return true
  }

  if (isLoadingDetails) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!requestDetails) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Upload Soil Test Report</h1>
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>
                  {error || "Request not found or you don't have permission to access it."}
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => router.push("/dashboard/soil-testing")}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Upload Soil Test Report</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Soil Test Report Upload</CardTitle>
            <CardDescription>Upload the soil test report and required photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Request Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Farmer</p>
                  <p className="font-medium">{requestDetails.farmer?.name || requestDetails.farmer?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{requestDetails.location}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contact Number</p>
                  <p className="font-medium">{requestDetails.contactNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Request Date</p>
                  <p className="font-medium">{new Date(requestDetails.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="reportFile"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Soil Test Report</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload the detailed soil test report (PDF, DOC, or image format)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="soilCollectionFile"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Soil Collection Photo</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...field} />
                      </FormControl>
                      <FormDescription>Upload a photo showing the soil collection process</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="farmerPhotoFile"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Photo with Farmer</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...field} />
                      </FormControl>
                      <FormDescription>Upload a photo of you with the farmer</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading files...
                    </>
                  ) : (
                    "Submit Report"
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
