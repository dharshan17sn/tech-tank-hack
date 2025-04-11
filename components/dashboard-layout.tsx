"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import type { UserRole } from "@prisma/client"
import { Home, User, Leaf, TestTube, BarChart3, Tag, LogOut, Menu, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useMobile } from "@/hooks/use-mobile"

type UserType = {
  id: string
  email: string
  role: UserRole
  name?: string | null
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMobile()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/user/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          // If not authenticated, redirect to login
          router.push("/login")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    if (user?.companyName) {
      return user.companyName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return user?.email.substring(0, 2).toUpperCase() || "U"
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      roles: ["FARMER", "SOIL_TEST_COMPANY", "SEED_PROVIDER", "MARKET_AGENT", "BUYER"],
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: <User className="h-5 w-5" />,
      roles: ["FARMER", "SOIL_TEST_COMPANY", "SEED_PROVIDER", "MARKET_AGENT", "BUYER"],
    },
    {
      name: "Crop Feeds",
      href: "/dashboard/crop-feeds",
      icon: <Leaf className="h-5 w-5" />,
      roles: ["FARMER", "SOIL_TEST_COMPANY", "SEED_PROVIDER", "MARKET_AGENT", "BUYER"],
    },
    {
      name: "Soil Testing",
      href: "/dashboard/soil-testing",
      icon: <TestTube className="h-5 w-5" />,
      roles: ["FARMER", "SOIL_TEST_COMPANY"],
    },
    {
      name: "Crop Monitoring",
      href: "/dashboard/crop-monitoring",
      icon: <MessageSquare className="h-5 w-5" />,
      roles: ["FARMER"],
    },
    {
      name: "Market",
      href: "/dashboard/market",
      icon: <BarChart3 className="h-5 w-5" />,
      roles: ["FARMER", "MARKET_AGENT", "BUYER"],
    },
    {
      name: "Bidding",
      href: "/dashboard/bidding",
      icon: <Tag className="h-5 w-5" />,
      roles: ["FARMER", "BUYER"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => !user?.role || item.roles.includes(user.role))

  const renderNavItems = () => (
    <ul className="space-y-2">
      {filteredNavItems.map((item) => (
        <li key={item.href}>
          <Link href={item.href}>
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === item.href
                  ? "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800"
                  : "hover:bg-gray-100"
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Button>
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      {isMobile && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-xl font-bold text-green-600">KrishiSaarthi</h1>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col h-full">
                  <div className="py-4 border-b">
                    <div className="flex items-center px-2">
                      <Avatar className="h-10 w-10 bg-green-600 text-white">
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="font-medium">{user?.name || user?.companyName || user?.email}</p>
                        <p className="text-sm text-gray-500">
                          {user?.role.charAt(0) + user?.role.slice(1).toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 py-4 overflow-auto">{renderNavItems()}</div>

                  <div className="py-4 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="ml-3">Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <Link href="/dashboard" className="flex items-center">
                  <h1 className="text-xl font-bold text-green-600">KrishiSaarthi</h1>
                </Link>
              </div>

              <div className="p-4 border-b">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 bg-green-600 text-white">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{user?.name || user?.companyName || user?.email}</p>
                    <p className="text-sm text-gray-500">
                      {user?.role.charAt(0) + user?.role.slice(1).toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-auto">{renderNavItems()}</div>

              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-3">Logout</span>
                </Button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto py-6 px-4">{children}</div>
        </main>
      </div>
    </div>
  )
}
