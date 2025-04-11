import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { login } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    const { email, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create session
    await login({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    return NextResponse.json({ message: "Login successful" }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
