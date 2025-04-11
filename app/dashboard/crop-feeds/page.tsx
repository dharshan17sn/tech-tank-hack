import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function CropFeedsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch crop feeds with user and comment count
  const cropFeeds = await prisma.cropFeed.findMany({
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

  const getInitials = (user: any) => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    }
    if (user.companyName) {
      return user.companyName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Crop Feeds</h1>
          <Link href="/dashboard/crop-feeds/new">
            <Button className="bg-green-600 hover:bg-green-700">Create New Post</Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {cropFeeds.length > 0 ? (
            cropFeeds.map((feed) => (
              <Card key={feed.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10 bg-green-600 text-white">
                        <AvatarFallback>{getInitials(feed.user)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{feed.title}</CardTitle>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-500">
                            {feed.user.name || feed.user.companyName || feed.user.email}
                          </span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(feed.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {feed.isAiQuery && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        AI Assisted
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{feed.description}</p>
                  {feed.imageUrl && (
                    <div className="mt-4">
                      <img
                        src={feed.imageUrl || "/placeholder.svg"}
                        alt={feed.title}
                        className="rounded-md max-h-64 object-cover"
                      />
                    </div>
                  )}
                  {feed.isAiQuery && feed.aiResponse && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-md">
                      <h4 className="font-medium text-blue-800 mb-2">AI Suggestion:</h4>
                      <p className="text-gray-700">{feed.aiResponse}</p>
                      {feed.wasHelpful !== null && (
                        <div className="mt-2 flex items-center">
                          <Badge variant={feed.wasHelpful ? "default" : "destructive"} className="text-xs">
                            {feed.wasHelpful ? "Helpful" : "Not Helpful"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Link href={`/dashboard/crop-feeds/${feed.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {feed._count.comments} {feed._count.comments === 1 ? "Comment" : "Comments"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500 mb-4">No crop feeds available yet.</p>
                <Link href="/dashboard/crop-feeds/new">
                  <Button className="bg-green-600 hover:bg-green-700">Create the First Post</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
