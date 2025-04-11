import { getSession } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import CommentForm from "@/components/comment-form"
import Link from "next/link"
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react"

export default async function CropFeedDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch crop feed with user and comments
  const cropFeed = await prisma.cropFeed.findUnique({
    where: { id: params.id },
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
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          cropFeed: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  })

  if (!cropFeed) {
    notFound()
  }

  // Fetch comment authors
  const commentUserIds = cropFeed.comments.map((comment) => comment.userId)
  const commentUsers = await prisma.user.findMany({
    where: {
      id: {
        in: commentUserIds,
      },
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
    },
  })

  // Map users to comments
  const commentsWithUsers = cropFeed.comments.map((comment) => {
    const user = commentUsers.find((u) => u.id === comment.userId)
    return {
      ...comment,
      user,
    }
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

  const isAuthor = session.id === cropFeed.userId

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/dashboard/crop-feeds" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Crop Feed Details</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <Avatar className="h-10 w-10 bg-green-600 text-white">
                  <AvatarFallback>{getInitials(cropFeed.user)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{cropFeed.title}</CardTitle>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">
                      {cropFeed.user.name || cropFeed.user.companyName || cropFeed.user.email}
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(cropFeed.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              {cropFeed.isAiQuery && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                  AI Assisted
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 whitespace-pre-line">{cropFeed.description}</p>

            {cropFeed.imageUrl && (
              <div className="mt-4">
                <img
                  src={cropFeed.imageUrl || "/placeholder.svg"}
                  alt={cropFeed.title}
                  className="rounded-md max-h-96 object-contain"
                />
              </div>
            )}

            {cropFeed.isAiQuery && cropFeed.aiResponse && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">AI Suggestion:</h4>
                <p className="text-gray-700 whitespace-pre-line">{cropFeed.aiResponse}</p>

                {isAuthor && cropFeed.wasHelpful === null && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Was this suggestion helpful?</p>
                    <div className="flex space-x-2">
                      <form action={`/api/crop-feeds/${cropFeed.id}/feedback`} method="POST">
                        <input type="hidden" name="helpful" value="true" />
                        <Button type="submit" variant="outline" size="sm" className="text-green-600 border-green-600">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Yes
                        </Button>
                      </form>
                      <form action={`/api/crop-feeds/${cropFeed.id}/feedback`} method="POST">
                        <input type="hidden" name="helpful" value="false" />
                        <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-600">
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          No
                        </Button>
                      </form>
                    </div>
                  </div>
                )}

                {cropFeed.wasHelpful !== null && (
                  <div className="mt-2 flex items-center">
                    <Badge variant={cropFeed.wasHelpful ? "default" : "destructive"} className="text-xs">
                      {cropFeed.wasHelpful ? "Marked as Helpful" : "Marked as Not Helpful"}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <Separator className="my-6" />

            <div>
              <h3 className="text-lg font-semibold mb-4">Comments ({commentsWithUsers.length})</h3>

              {commentsWithUsers.length > 0 ? (
                <div className="space-y-6">
                  {commentsWithUsers.map((comment) => (
                    <div key={comment.id} className="flex space-x-4">
                      <Avatar className="h-8 w-8 bg-gray-300 text-gray-600">
                        <AvatarFallback>{getInitials(comment.user!)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">
                              {comment.user?.name || comment.user?.companyName || comment.user?.email}
                              {comment.userId === cropFeed.userId && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Author
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              )}

              <div className="mt-6">
                <CommentForm cropFeedId={cropFeed.id} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
