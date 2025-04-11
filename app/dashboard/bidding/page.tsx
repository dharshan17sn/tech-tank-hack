import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserRole } from "@prisma/client"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Plus, Clock } from "lucide-react"

export default async function BiddingPage() {
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

  // Fetch bidding entries
  let biddingEntries = []

  if (user.role === UserRole.FARMER) {
    // Farmers see their own bidding entries
    biddingEntries = await prisma.biddingEntry.findMany({
      where: { farmerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { bids: true },
        },
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
        },
      },
    })
  } else if (user.role === UserRole.BUYER) {
    // Buyers see all active bidding entries
    biddingEntries = await prisma.biddingEntry.findMany({
      where: { isActive: true },
      orderBy: { endDate: "asc" },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { bids: true },
        },
        bids: {
          where: { buyerId: user.id },
          orderBy: { amount: "desc" },
          take: 1,
        },
      },
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Crop Bidding</h1>
          {user.role === UserRole.FARMER && (
            <Link href="/dashboard/bidding/new">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                New Bidding
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {biddingEntries.length > 0 ? (
            biddingEntries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden">
                {entry.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={entry.imageUrl || "/placeholder.svg"}
                      alt={entry.cropName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{entry.cropName}</CardTitle>
                      <CardDescription>By {entry.farmer.name || entry.farmer.email}</CardDescription>
                    </div>
                    <Badge
                      variant={entry.isActive ? "default" : "secondary"}
                      className={
                        entry.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }
                    >
                      {entry.isActive ? "Active" : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base Price:</span>
                      <span className="font-medium">₹{entry.basePrice}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Highest Bid:</span>
                      <span className="font-medium">
                        {entry.bids && entry.bids.length > 0 ? `₹${entry.bids[0].amount}/kg` : "No bids yet"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Bids:</span>
                      <span className="font-medium">{entry._count.bids}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Ends in:
                      </span>
                      <span className="font-medium">
                        {new Date(entry.endDate) > new Date()
                          ? formatDistanceToNow(new Date(entry.endDate), { addSuffix: true })
                          : "Ended"}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/dashboard/bidding/${entry.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      {user.role === UserRole.FARMER ? "View Details" : "Place Bid"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500 mb-4">
                    {user.role === UserRole.FARMER
                      ? "You haven't created any bidding entries yet."
                      : "There are no active bidding entries available."}
                  </p>
                  {user.role === UserRole.FARMER && (
                    <Link href="/dashboard/bidding/new">
                      <Button className="bg-green-600 hover:bg-green-700">Create Your First Bidding</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
