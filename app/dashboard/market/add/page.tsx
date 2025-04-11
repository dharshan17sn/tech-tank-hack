"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  cropName: z.string().min(2, { message: "Crop name must be at least 2 characters" }),
  marketName: z.string().min(2, { message: "Market name must be at least 2 characters" }),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Please enter a valid date" }),
  cropType: z.enum(["SHORT_TERM", "SEASONAL", "LONG_TERM"]),
  uploadImage: z.boolean().default(false),
})

export default function AddMarketPricePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cropName: "",
      marketName: "",
      price: undefined,
      date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
      cropType: "SEASONAL",
      uploadImage: false,
    },
  })

  const watchUploadImage = form.watch("uploadImage")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      let imageUrl = null

      // If image upload is enabled and a file is selected
      if (values.uploadImage && selectedFile) {
        setIsUploading(true)

        // Get a pre-signed URL from the server
        const presignedRes = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            contentType: selectedFile.type,
            folder: "crop-images",
          }),
        })

        if (!presignedRes.ok) {
          throw new Error("Failed to get upload URL")
        }

        const { uploadUrl, publicUrl } = await presignedRes.json()

        // Upload the file directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": selectedFile.type,
          },
        })

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image")
        }

        imageUrl = publicUrl
        setIsUploading(false)
      }

      // Create the market price entry
      const response = await fetch("/api/market/prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          imageUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add market price")
      }

      router.push("/dashboard/market")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add market price")
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Add Market Price</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Market Price Entry</CardTitle>
            <CardDescription>Add current crop prices to help farmers make informed decisions</CardDescription>
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
                  name="cropName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Tomato, Rice, Wheat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Ahmedabad APMC, Surat Wholesale Market" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (per kg in ₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="E.g., 25.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select crop type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SHORT_TERM">Short Term (e.g., Leafy Vegetables)</SelectItem>
                          <SelectItem value="SEASONAL">Seasonal (e.g., Rice, Wheat)</SelectItem>
                          <SelectItem value="LONG_TERM">Long Term (e.g., Coconut, Mango)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uploadImage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Upload an image</FormLabel>
                        <FormDescription>Add a photo of the crop (optional)</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {watchUploadImage && (
                  <div className="border rounded-md p-4">
                    <Input type="file" accept="image/*" onChange={handleFileChange} className="mb-2" />
                    {selectedFile && <p className="text-sm text-gray-500">Selected: {selectedFile.name}</p>}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading || isUploading}
                >
                  {isLoading || isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? "Uploading image..." : "Adding price..."}
                    </>
                  ) : (
                    "Add Market Price"
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
