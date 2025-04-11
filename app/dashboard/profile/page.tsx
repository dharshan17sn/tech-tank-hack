import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserRole } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch user profile data
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      cropFeeds: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      feedbacks: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          giver: true,
        },
      },
      soilTestReports: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) {
    redirect("/login")
  }

  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    if (user.companyName) {
      return user.companyName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16 bg-green-600 text-white">
                  <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user.name || user.companyName || user.email}</h3>
                  <div className="flex items-center mt-1">
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                      {user.role.charAt(0) + user.role.slice(1).toLowerCase().replace("_", " ")}
                    </Badge>
                    <span className="ml-2 text-sm text-gray-500">
                      Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p>{user.email}</p>
                </div>

                {user.contactNumber && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                    <p>{user.contactNumber}</p>
                  </div>
                )}

                {user.address && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Address</h4>
                    <p>{user.address}</p>
                  </div>
                )}

                {user.farmerCardNumber && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Farmer Card Number</h4>
                    <p>{user.farmerCardNumber}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-500">KrishiStars</h4>
                  <div className="flex items-center">
                    <span className="text-amber-500 text-xl mr-2">★</span>
                    <span>{user.krishiStars}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>Feedback received from other users</CardDescription>
            </CardHeader>
            <CardContent>
              {user.feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {user.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={i < feedback.rating ? "text-amber-500" : "text-gray-300"}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">
                            by {feedback.giver.name || feedback.giver.companyName || feedback.giver.email}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {feedback.comment && <p className="mt-2 text-sm text-gray-600">{feedback.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No feedback received yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Crop Feeds</CardTitle>
              <CardDescription>Your recent posts and questions</CardDescription>
            </CardHeader>
            <CardContent>
              {user.cropFeeds.length > 0 ? (
                <div className="space-y-4">
                  {user.cropFeeds.map((feed) => (
                    <div key={feed.id} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{feed.title}</h4>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(feed.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{feed.description}</p>
                      {feed.isAiQuery && (
                        <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 hover:bg-blue-100">
                          AI Assisted
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No crop feeds posted yet.</p>
              )}
            </CardContent>
          </Card>

          {user.role === UserRole.SOIL_TEST_COMPANY && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Soil Test Reports</CardTitle>
                <CardDescription>Reports you've submitted</CardDescription>
              </CardHeader>
              <CardContent>
                {user.soilTestReports.length > 0 ? (
                  <div className="space-y-4">
                    {user.soilTestReports.map((report) => (
                      <div key={report.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                        <div>
                          <h4 className="font-medium">Report #{report.id.substring(0, 8)}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <a
                          href={report.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          View Report
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No soil test reports submitted yet.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
