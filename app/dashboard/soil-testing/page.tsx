import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserRole } from "@prisma/client"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { FileText, MapPin, Phone } from "lucide-react"

export default async function SoilTestingPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch user to determine role
  const user = await prisma.user.findUnique({
    where: { id: session.id },
  })

  if (!user) {
    redirect("/login")
  }

  // Fetch data based on user role
  let pendingRequests: any[] = []
  let completedRequests: any[] = []

  if (user.role === UserRole.FARMER) {
    // For farmers, fetch their requests
    const requests = await prisma.soilTestRequest.findMany({
      where: { farmerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        reports: {
          include: {
            soilTester: {
              select: {
                id: true,
                companyName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    pendingRequests = requests.filter((req) => req.status !== "COMPLETED")
    completedRequests = requests.filter((req) => req.status === "COMPLETED")
  } else if (user.role === UserRole.SOIL_TEST_COMPANY) {
    // For soil test companies, fetch all pending requests and their completed reports
    pendingRequests = await prisma.soilTestRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const reports = await prisma.soilTestReport.findMany({
      where: { soilTesterId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        request: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    completedRequests = reports.map((report) => report.request)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Soil Testing</h1>
          {user.role === UserRole.FARMER && (
            <Link href="/dashboard/soil-testing/request">
              <Button className="bg-green-600 hover:bg-green-700">Request Soil Test</Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            <TabsTrigger value="completed">Completed Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingRequests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">Soil Test Request</CardTitle>
                        <Badge
                          variant={request.status === "ACCEPTED" ? "outline" : "secondary"}
                          className={
                            request.status === "ACCEPTED"
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Location</p>
                            <p>{request.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Phone className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Contact Number</p>
                            <p>{request.contactNumber}</p>
                          </div>
                        </div>

                        {user.role === UserRole.SOIL_TEST_COMPANY && (
                          <div className="flex items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Farmer</p>
                              <p>{request.farmer.name || request.farmer.email}</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          {user.role === UserRole.SOIL_TEST_COMPANY ? (
                            request.status === "PENDING" ? (
                              <form action={`/api/soil-testing/${request.id}/accept`} method="POST">
                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                                  Accept Request
                                </Button>
                              </form>
                            ) : (
                              <Link href={`/dashboard/soil-testing/${request.id}/upload`}>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700">Upload Report</Button>
                              </Link>
                            )
                          ) : (
                            <p className="text-center text-sm text-gray-500">
                              {request.status === "PENDING"
                                ? "Waiting for a soil testing company to accept your request"
                                : "A soil testing company is processing your request"}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500 mb-4">
                    {user.role === UserRole.FARMER
                      ? "You have no pending soil test requests."
                      : "There are no pending soil test requests."}
                  </p>
                  {user.role === UserRole.FARMER && (
                    <Link href="/dashboard/soil-testing/request">
                      <Button className="bg-green-600 hover:bg-green-700">Request Soil Test</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedRequests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {completedRequests.map((request) => {
                  // Find the report for this request
                  const report =
                    user.role === UserRole.FARMER
                      ? request.reports[0]
                      : request.reports?.find((r: any) => r.soilTesterId === user.id)

                  return (
                    <Card key={request.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Soil Test Report</CardTitle>
                          <Badge className="bg-green-50 text-green-700 hover:bg-green-100">COMPLETED</Badge>
                        </div>
                        <CardDescription>
                          Completed{" "}
                          {formatDistanceToNow(new Date(report?.createdAt || request.updatedAt), { addSuffix: true })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Location</p>
                              <p>{request.location}</p>
                            </div>
                          </div>

                          {user.role === UserRole.SOIL_TEST_COMPANY && (
                            <div className="flex items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Farmer</p>
                                <p>{request.farmer?.name || request.farmer?.email}</p>
                              </div>
                            </div>
                          )}

                          {user.role === UserRole.FARMER && report?.soilTester && (
                            <div className="flex items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Tested By</p>
                                <p>{report.soilTester.companyName || report.soilTester.email}</p>
                              </div>
                            </div>
                          )}

                          {report && (
                            <div className="space-y-2 pt-2">
                              <a
                                href={report.reportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-full p-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Soil Report
                              </a>

                              <div className="grid grid-cols-2 gap-2">
                                <a
                                  href={report.soilCollectionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                                >
                                  Soil Collection Photo
                                </a>
                                <a
                                  href={report.farmerPhotoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                                >
                                  Farmer Photo
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">
                    {user.role === UserRole.FARMER
                      ? "You have no completed soil test reports yet."
                      : "You have not completed any soil test reports yet."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
