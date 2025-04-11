import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the path is protected
  if (pathname.startsWith("/dashboard")) {
    const session = await getSession()

    // If not authenticated, redirect to login
    if (!session) {
      const url = new URL("/login", request.url)
      return NextResponse.redirect(url)
    }
  }

  // Check if user is already logged in and trying to access login/register pages
  if (pathname === "/login" || pathname === "/register") {
    const session = await getSession()

    // If authenticated, redirect to dashboard
    if (session) {
      const url = new URL("/dashboard", request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}
