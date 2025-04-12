"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { UserRole } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  role: z.enum(["FARMER", "SOIL_TEST_COMPANY", "SEED_PROVIDER", "MARKET_AGENT", "BUYER"]),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  farmerCardNumber: z.string().optional(),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters" }).optional(),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }).optional(),
  contactNumber: z.string().min(10, { message: "Contact number must be at least 10 digits" }).optional(),
})

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  console.log("Component rendered")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      farmerCardNumber: "",
      companyName: "",
      address: "",
      contactNumber: "",
    },
  })

  console.log("Form initialized:", form.formState)

  // Update form validation based on role
  useEffect(() => {
    const role = form.watch("role")
    if (role === "FARMER") {
      form.setValue("name", "")
      form.setValue("companyName", undefined)
      form.setValue("address", undefined)
      form.setValue("contactNumber", undefined)
    } else if (["SOIL_TEST_COMPANY", "SEED_PROVIDER", "MARKET_AGENT"].includes(role || "")) {
      form.setValue("name", undefined)
      form.setValue("companyName", "")
      form.setValue("address", "")
      form.setValue("contactNumber", "")
      form.setValue("farmerCardNumber", undefined)
    } else if (role === "BUYER") {
      form.setValue("name", "")
      form.setValue("companyName", undefined)
      form.setValue("address", undefined)
      form.setValue("contactNumber", "")
      form.setValue("farmerCardNumber", undefined)
    }
  }, [form.watch("role")])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("onSubmit function called")
    console.log("Form values:", values)
    console.log("Selected role:", values.role)
    
    setIsLoading(true)
    setError(null)

    try {
      console.log("Sending registration request to API...")
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          // Ensure optional fields are properly handled
          name: values.name || undefined,
          farmerCardNumber: values.farmerCardNumber || undefined,
          companyName: values.companyName || undefined,
          address: values.address || undefined,
          contactNumber: values.contactNumber || undefined,
        }),
      })

      console.log("API Response status:", response.status)
      const data = await response.json()
      console.log("API Response data:", data)

      if (!response.ok) {
        console.error("Registration failed:", data.error)
        if (data.details) {
          console.error("Validation details:", data.details)
        }
        throw new Error(data.error || "Registration failed")
      }

      console.log("Registration successful, redirecting to login...")
      router.push("/login?registered=true")
    } catch (err) {
      console.error("Registration error:", err)
      const errorMessage = err instanceof Error ? err.message : "Registration failed"
      setError(errorMessage)
      alert(`Registration failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Join KrishiSaarthi to connect with the agricultural community</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form 
              onSubmit={(e) => {
                console.log("Form submit event triggered")
                e.preventDefault()
                form.handleSubmit(onSubmit)(e)
              }} 
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="email@example.com" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e)
                          console.log("Email value:", e.target.value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="********" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          console.log("Password length:", e.target.value.length)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedRole(value as UserRole)
                        console.log("Selected role:", value)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FARMER">Farmer</SelectItem>
                        <SelectItem value="SOIL_TEST_COMPANY">Soil Testing Company</SelectItem>
                        <SelectItem value="SEED_PROVIDER">Seed Provider</SelectItem>
                        <SelectItem value="MARKET_AGENT">Market Agent</SelectItem>
                        <SelectItem value="BUYER">Buyer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === "FARMER" && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="farmerCardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farmer Card Number</FormLabel>
                        <FormControl>
                          <Input placeholder="FARM123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {(selectedRole === "SOIL_TEST_COMPANY" ||
                selectedRole === "SEED_PROVIDER" ||
                selectedRole === "MARKET_AGENT") && (
                <>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your company name" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              console.log("Company name:", e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your company address" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              console.log("Address:", e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your contact number" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              console.log("Contact number:", e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedRole === "BUYER" && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your contact number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700" 
                disabled={isLoading}
                onClick={() => {
                  console.log("Register button clicked")
                  if (!form.formState.isValid) {
                    console.log("Form is not valid:", form.formState.errors)
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-green-600 hover:underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
