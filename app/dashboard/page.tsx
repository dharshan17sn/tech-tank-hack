import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRole } from "@prisma/client"
import { Leaf, TestTube, BarChart3, Tag, Users } from "lucide-react"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch user-specific dashboard data
  const user = await prisma.user.findUnique({
    where: { id: session.id },
  })

  if (!user) {
    redirect("/login")
  }

  // Fetch counts based on user role
  let stats = []

  if (user.role === UserRole.FARMER) {
    const [cropFeedsCount, soilTestRequestsCount, biddingEntriesCount] = await Promise.all([
      prisma.cropFeed.count({ where: { userId: user.id } }),
      prisma.soilTestRequest.count({ where: { farmerId: user.id } }),
      prisma.biddingEntry.count({ where: { farmerId: user.id } }),
    ])

    stats = [
      {
        title: "Crop Feeds",
        value: cropFeedsCount,
        icon: <Leaf className="h-5 w-5" />,
        color: "bg-green-100 text-green-800",
      },
      {
        title: "Soil Test Requests",
        value: soilTestRequestsCount,
        icon: <TestTube className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-800",
      },
      {
        title: "Active Biddings",
        value: biddingEntriesCount,
        icon: <Tag className="h-5 w-5" />,
        color: "bg-purple-100 text-purple-800",
      },
    ]
  } else if (user.role === UserRole.SOIL_TEST_COMPANY) {
    const [pendingRequestsCount, completedReportsCount] = await Promise.all([
      prisma.soilTestRequest.count({ where: { status: "PENDING" } }),
      prisma.soilTestReport.count({ where: { soilTesterId: user.id } }),
    ])

    stats = [
      {
        title: "Pending Requests",
        value: pendingRequestsCount,
        icon: <TestTube className="h-5 w-5" />,
        color: "bg-yellow-100 text-yellow-800",
      },
      {
        title: "Completed Reports",
        value: completedReportsCount,
        icon: <TestTube className="h-5 w-5" />,
        color: "bg-green-100 text-green-800",
      },
    ]
  } else if (user.role === UserRole.MARKET_AGENT) {
    const marketPricesCount = await prisma.marketPrice.count({ where: { agentId: user.id } })

    stats = [
      {
        title: "Market Prices Added",
        value: marketPricesCount,
        icon: <BarChart3 className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-800",
      },
    ]
  } else if (user.role === UserRole.BUYER) {
    const [activeBidsCount, wonBidsCount] = await Promise.all([
      prisma.bid.count({ where: { buyerId: user.id } }),
      prisma.biddingEntry.count({
        where: {
          bids: {
            some: {
              buyerId: user.id,
              id: { equals: prisma.biddingEntry.fields.winningBidId },
            },
          },
        },
      }),
    ])

    stats = [
      {
        title: "Active Bids",
        value: activeBidsCount,
        icon: <Tag className="h-5 w-5" />,
        color: "bg-purple-100 text-purple-800",
      },
      {
        title: "Won Bids",
        value: wonBidsCount,
        icon: <Tag className="h-5 w-5" />,
        color: "bg-green-100 text-green-800",
      },
    ]
  }

  // Add krishiStars for all users
  stats.push({
    title: "KrishiStars",
    value: user.krishiStars,
    icon: <Users className="h-5 w-5" />,
    color: "bg-amber-100 text-amber-800",
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.color}`}>{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {user.name || user.companyName || user.email}</CardTitle>
              <CardDescription>
                {user.role === UserRole.FARMER && "Manage your farm activities and connect with agricultural services."}
                {user.role === UserRole.SOIL_TEST_COMPANY &&
                  "Manage soil test requests and provide reports to farmers."}
                {user.role === UserRole.SEED_PROVIDER && "Connect with farmers and provide quality seeds."}
                {user.role === UserRole.MARKET_AGENT &&
                  "Update market prices and help farmers make informed decisions."}
                {user.role === UserRole.BUYER && "Browse and bid on available crops from farmers."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Use the navigation menu to access different features of KrishiSaarthi.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
              <CardDescription>Make the most of KrishiSaarthi</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-500">
                {user.role === UserRole.FARMER && (
                  <>
                    <li>• Request soil tests to improve your crop yield</li>
                    <li>• Share your farming challenges in Crop Feeds</li>
                    <li>• Monitor market prices before harvesting</li>
                    <li>• Use the bidding system to get the best price for your crops</li>
                  </>
                )}
                {user.role === UserRole.SOIL_TEST_COMPANY && (
                  <>
                    <li>• Respond to soil test requests promptly</li>
                    <li>• Upload detailed reports with recommendations</li>
                    <li>• Engage with farmers in Crop Feeds to build your reputation</li>
                  </>
                )}
                {user.role === UserRole.MARKET_AGENT && (
                  <>
                    <li>• Keep market prices updated regularly</li>
                    <li>• Add detailed information about crop quality</li>
                    <li>• Provide insights on market trends</li>
                  </>
                )}
                {user.role === UserRole.BUYER && (
                  <>
                    <li>• Browse active biddings to find quality crops</li>
                    <li>• Place competitive bids to secure your purchases</li>
                    <li>• Leave feedback for farmers after successful transactions</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
