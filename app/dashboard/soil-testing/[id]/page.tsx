"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Leaf, TrendingUp, Cloud, Droplets } from "lucide-react"

// Mock data for demonstration
const mockSoilData = {
  pH: 6.8,
  nitrogen: "Medium",
  phosphorus: "High",
  potassium: "Low",
  organicMatter: "Medium",
  moisture: "Good",
}

const mockWeatherData = {
  temperature: "25°C",
  rainfall: "1200mm/year",
  humidity: "65%",
  season: "Monsoon",
}

const mockMarketData = {
  rice: {
    currentPrice: "₹2,500/quintal",
    demand: "High",
    trend: "Increasing",
  },
  wheat: {
    currentPrice: "₹2,200/quintal",
    demand: "Medium",
    trend: "Stable",
  },
  maize: {
    currentPrice: "₹1,800/quintal",
    demand: "High",
    trend: "Increasing",
  },
}

const mockRecommendations = [
  {
    crop: "Rice",
    score: 95,
    reasons: [
      "Soil pH (6.8) is ideal for rice cultivation",
      "High phosphorus levels support root development",
      "Good moisture retention in the soil",
      "Current market demand and prices are favorable",
      "Monsoon season provides optimal growing conditions",
    ],
  },
  {
    crop: "Maize",
    score: 88,
    reasons: [
      "Soil conditions are suitable for maize growth",
      "Medium nitrogen levels can be supplemented",
      "Good market demand and increasing prices",
      "Monsoon season provides adequate rainfall",
    ],
  },
  {
    crop: "Wheat",
    score: 75,
    reasons: [
      "Soil pH is slightly high for optimal wheat growth",
      "Low potassium levels may need supplementation",
      "Market prices are stable but not as profitable as rice",
    ],
  },
]

export default function SoilTestReportPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState("recommendations")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Soil Test Report</h1>
          <Badge className="bg-green-50 text-green-700 hover:bg-green-100">COMPLETED</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="soil">Soil Analysis</TabsTrigger>
            <TabsTrigger value="market">Market Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="mt-6">
            <div className="grid gap-6">
              {mockRecommendations.map((crop) => (
                <Card key={crop.crop}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-green-600" />
                        <CardTitle>{crop.crop}</CardTitle>
                      </div>
                      <Badge
                        className={
                          crop.score >= 90
                            ? "bg-green-50 text-green-700"
                            : crop.score >= 80
                            ? "bg-blue-50 text-blue-700"
                            : "bg-yellow-50 text-yellow-700"
                        }
                      >
                        {crop.score}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Why {crop.crop} is recommended:</h4>
                        <ul className="space-y-2">
                          {crop.reasons.map((reason, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-2" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Next Steps:</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2" />
                            <span>Prepare soil with recommended fertilizers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2" />
                            <span>Plan planting schedule based on weather forecast</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2" />
                            <span>Connect with local buyers for better market access</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="soil" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    <CardTitle>Soil Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(mockSoilData).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <Badge
                          variant="outline"
                          className={
                            value === "High"
                              ? "bg-green-50 text-green-700"
                              : value === "Medium"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-red-50 text-red-700"
                          }
                        >
                          {value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-blue-600" />
                    <CardTitle>Weather Conditions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(mockWeatherData).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <div className="grid gap-4">
              {Object.entries(mockMarketData).map(([crop, data]) => (
                <Card key={crop}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <CardTitle className="capitalize">{crop}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Current Price</span>
                        <span className="font-medium">{data.currentPrice}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Market Demand</span>
                        <Badge
                          variant="outline"
                          className={
                            data.demand === "High"
                              ? "bg-green-50 text-green-700"
                              : data.demand === "Medium"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-red-50 text-red-700"
                          }
                        >
                          {data.demand}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Price Trend</span>
                        <Badge
                          variant="outline"
                          className={
                            data.trend === "Increasing"
                              ? "bg-green-50 text-green-700"
                              : data.trend === "Stable"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }
                        >
                          {data.trend}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 