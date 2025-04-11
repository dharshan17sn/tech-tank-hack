import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["FARMER", "SOIL_TEST_COMPANY", "SEED_PROVIDER", "MARKET_AGENT", "BUYER"]),
  name: z.string().optional(),
  farmerCardNumber: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input data", details: validation.error.format() }, { status: 400 })
    }

    const { email, password, role, name, farmerCardNumber, companyName, address, contactNumber } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Check if farmer card number is already used (if provided)
    if (farmerCardNumber) {
      const existingFarmerCard = await prisma.user.findUnique({
        where: { farmerCardNumber },
      })

      if (existingFarmerCard) {
        return NextResponse.json({ error: "This farmer card number is already registered" }, { status: 409 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        name,
        farmerCardNumber,
        companyName,
        address,
        contactNumber,
      },
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ message: "User registered successfully", user: userWithoutPassword }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
