

import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRole } from "@prisma/client"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { TrendingUp, Leaf, Calendar, Plus } from "lucide-react"
import TrendLineChart from "@/components/v2chart"
import VolatilityChart from "@/components/v1chart"



export default async function MarketPage() {
  const session = await getSession()

  console.log(session);
  

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

  // Fetch market prices
  const marketPrices = await prisma.marketPrice.findMany({
    orderBy: { date: "desc" },
    include: {
      agent: {
        select: {
          id: true,
          companyName: true,
          email: true,
        },
      },
    },
  })

  // Group market prices by crop type
  const shortTermCrops = marketPrices.filter((price) => price.cropType === "SHORT_TERM")
  const seasonalCrops = marketPrices.filter((price) => price.cropType === "SEASONAL")
  const longTermCrops = marketPrices.filter((price) => price.cropType === "LONG_TERM")

  // Get unique crop names
  const uniqueCrops = [...new Set(marketPrices.map((price) => price.cropName))]

  // Prepare data for price trends chart
  const trendData: Record<string, any[]> = {}

  uniqueCrops.forEach((cropName) => {
    const cropPrices = marketPrices
      .filter((price) => price.cropName === cropName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (cropPrices.length > 0) {
      trendData[cropName] = cropPrices.map((price) => ({
        date: new Date(price.date).toLocaleDateString(),
        price: price.price,
      }))
    }
  })

  // Calculate volatility scores
  const volatilityScores: Record<string, number> = {}

  Object.entries(trendData).forEach(([cropName, data]) => {
    if (data.length > 1) {
      const prices = data.map((item) => item.price)
      const priceChanges = prices
        .slice(1)
        .map((price, index) => (Math.abs(price - prices[index]) / prices[index]) * 100)

      const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length
      volatilityScores[cropName] = Number.parseFloat(avgChange.toFixed(2))
    } else {
      volatilityScores[cropName] = 0
    }
  })

  // Sort crops by volatility
  const sortedByVolatility = Object.entries(volatilityScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Prepare data for volatility chart
  const volatilityChartData = sortedByVolatility.map(([cropName, score]) => ({
    name: cropName,
    volatility: score,
  }))

  // Prepare data for price comparison chart
  const priceComparisonData = uniqueCrops.map((cropName) => {
    const latestPrice = marketPrices
      .filter((price) => price.cropName === cropName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    return {
      name: cropName,
      price: latestPrice.price,
      type: latestPrice.cropType,
    }
  })

  // Get the most recent prices for each crop
  const latestPrices = uniqueCrops.map((cropName) => {
    const prices = marketPrices
      .filter((price) => price.cropName === cropName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return prices[0]
  })

  // Sort by date (most recent first)
  latestPrices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
  
   
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Market Insights</h1>
          {user.role === UserRole.MARKET_AGENT && (
            <Link href="/dashboard/market/add">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Price
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Volatility</CardTitle>
              <div className="rounded-full p-2 bg-yellow-100 text-yellow-800">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sortedByVolatility.length > 0 ? `${sortedByVolatility[0][1]}%` : "0%"}
              </div>
              <p className="text-xs text-gray-500">
                Highest volatility: {sortedByVolatility.length > 0 ? sortedByVolatility[0][0] : "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Crops Tracked</CardTitle>
              <div className="rounded-full p-2 bg-green-100 text-green-800">
                <Leaf className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueCrops.length}</div>
              <p className="text-xs text-gray-500">
                Across {[...new Set(marketPrices.map((price) => price.marketName))].length} markets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Update</CardTitle>
              <div className="rounded-full p-2 bg-blue-100 text-blue-800">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketPrices.length > 0
                  ? formatDistanceToNow(new Date(marketPrices[0].date), { addSuffix: true })
                  : "No data"}
              </div>
              <p className="text-xs text-gray-500">
                {marketPrices.length > 0 ? `${marketPrices[0].cropName} at ${marketPrices[0].marketName}` : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        {volatilityChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Price Volatility by Crop</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
               <VolatilityChart data= {volatilityChartData}></VolatilityChart>
              </div>
            </CardContent>
          </Card>
        )}

        {Object.keys(trendData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Price Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">

                <TrendLineChart trendData={trendData}></TrendLineChart>

                
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Latest Market Prices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestPrices.slice(0, 10).map((price) => (
                  <div
                    key={price.id}
                    className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{price.cropName}</p>
                      <p className="text-sm text-gray-500">{price.marketName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{price.price}/kg</p>
                      <p className="text-xs text-gray-500">{new Date(price.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crop Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Short-Term Crops</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[...new Set(shortTermCrops.map((price) => price.cropName))].map((cropName) => (
                      <div key={cropName} className="bg-green-50 p-2 rounded-md text-center">
                        {cropName}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Seasonal Crops</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[...new Set(seasonalCrops.map((price) => price.cropName))].map((cropName) => (
                      <div key={cropName} className="bg-blue-50 p-2 rounded-md text-center">
                        {cropName}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Long-Term Crops</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[...new Set(longTermCrops.map((price) => price.cropName))].map((cropName) => (
                      <div key={cropName} className="bg-amber-50 p-2 rounded-md text-center">
                        {cropName}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  
  )
}
