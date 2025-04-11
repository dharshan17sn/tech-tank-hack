
import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import type { UserRole } from "@prisma/client"

const secretKey = process.env.JWT_SECRET || "your-secret-key"
const key = new TextEncoder().encode(secretKey)

export type JWTPayload = {
  id: string
  email: string
  role: UserRole
  name?: string | null
}

export async function encrypt(payload: JWTPayload) {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1d").sign(key)
}

export async function decrypt(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
  })
  return payload as JWTPayload
}

export async function login(payload: JWTPayload) {
  const token = await encrypt(payload)
  const cookieStore = await cookies()
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  })
  return token
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    sameSite: "strict",
    path: "/",
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  if (!token) return null
  try {
    const payload = await decrypt(token)
    return payload
  } catch (error) {
    return null
  }
}

export function withAuth(
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>,
  allowedRoles?: UserRole[],
) {
  return async (req: NextRequest) => {
    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    try {
      const payload = await decrypt(token)

      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
      }

      return handler(req, payload)
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 })
    }
  }
}
