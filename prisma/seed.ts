import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Clear existing data
  await prisma.bid.deleteMany()
  await prisma.biddingEntry.deleteMany()
  await prisma.marketPrice.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.soilTestReport.deleteMany()
  await prisma.soilTestRequest.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.cropFeed.deleteMany()
  await prisma.user.deleteMany()

  console.log("Cleared existing data")

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 10)

  const farmer1 = await prisma.user.create({
    data: {
      email: "farmer1@example.com",
      password: hashedPassword,
      role: UserRole.FARMER,
      name: "Rajesh Kumar",
      farmerCardNumber: "FARM123456",
      contactNumber: "+91 9876543210",
      krishiStars: 15,
    },
  })

  const farmer2 = await prisma.user.create({
    data: {
      email: "farmer2@example.com",
      password: hashedPassword,
      role: UserRole.FARMER,
      name: "Suresh Patel",
      farmerCardNumber: "FARM789012",
      contactNumber: "+91 9876543211",
      krishiStars: 8,
    },
  })

  const soilTestCompany = await prisma.user.create({
    data: {
      email: "soiltest@example.com",
      password: hashedPassword,
      role: UserRole.SOIL_TEST_COMPANY,
      companyName: "Soil Health Labs",
      address: "123 Lab Street, Agri City",
      contactNumber: "+91 9876543212",
      krishiStars: 20,
    },
  })

  const seedProvider = await prisma.user.create({
    data: {
      email: "seeds@example.com",
      password: hashedPassword,
      role: UserRole.SEED_PROVIDER,
      companyName: "Green Seeds Co.",
      address: "456 Seed Avenue, Plant Town",
      contactNumber: "+91 9876543213",
      krishiStars: 12,
    },
  })

  const marketAgent = await prisma.user.create({
    data: {
      email: "market@example.com",
      password: hashedPassword,
      role: UserRole.MARKET_AGENT,
      companyName: "AgriMarket Solutions",
      address: "789 Market Road, Trade City",
      contactNumber: "+91 9876543214",
      krishiStars: 18,
    },
  })

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@example.com",
      password: hashedPassword,
      role: UserRole.BUYER,
      name: "Priya Sharma",
      contactNumber: "+91 9876543215",
      krishiStars: 10,
    },
  })

  console.log("Created users")

  // Create crop feeds
  const cropFeed1 = await prisma.cropFeed.create({
    data: {
      title: "Yellow spots on tomato leaves",
      description:
        "I noticed yellow spots on my tomato plant leaves. The spots are small and scattered across the leaves. The plants are about 4 weeks old. What could be causing this and how can I treat it?",
      isAiQuery: true,
      aiResponse:
        "Based on your description, this appears to be a case of early blight, a fungal disease common in tomatoes. The yellow spots with concentric rings are characteristic of this condition. To treat it:\n\n1. Remove affected leaves immediately\n2. Improve air circulation around plants\n3. Apply a copper-based fungicide\n4. Avoid overhead watering\n5. Mulch around plants to prevent soil splash\n\nFor prevention, rotate crops and avoid planting tomatoes in the same location for 3-4 years.",
      wasHelpful: true,
      userId: farmer1.id,
    },
  })

  const cropFeed2 = await prisma.cropFeed.create({
    data: {
      title: "Best practices for rice cultivation",
      description:
        "I am planning to grow rice this season. Can experienced farmers share some best practices for maximizing yield? I have about 2 acres of land with good water access.",
      isAiQuery: false,
      userId: farmer2.id,
    },
  })

  console.log("Created crop feeds")

  // Create comments
  await prisma.comment.create({
    data: {
      content:
        "I had a similar issue last season. The AI suggestion worked well for me. Make sure to apply the fungicide in the evening to prevent leaf burn.",
      cropFeedId: cropFeed1.id,
      userId: farmer2.id,
    },
  })

  await prisma.comment.create({
    data: {
      content:
        "For rice cultivation, I recommend using the SRI (System of Rice Intensification) method. It uses less water and seeds but gives higher yields. Key points: plant younger seedlings, wider spacing, and intermittent irrigation.",
      cropFeedId: cropFeed2.id,
      userId: farmer1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content:
        "We offer high-quality rice seeds that are disease-resistant and have shown 15-20% higher yields in local conditions. Feel free to contact us for more information.",
      cropFeedId: cropFeed2.id,
      userId: seedProvider.id,
    },
  })

  console.log("Created comments")

  // Create soil test requests
  const soilRequest1 = await prisma.soilTestRequest.create({
    data: {
      location: "North Field, Village Sundarpur, District Mehsana",
      contactNumber: "+91 9876543210",
      status: "COMPLETED",
      farmerId: farmer1.id,
    },
  })

  const soilRequest2 = await prisma.soilTestRequest.create({
    data: {
      location: "South Field, Village Greendale, District Anand",
      contactNumber: "+91 9876543211",
      status: "PENDING",
      farmerId: farmer2.id,
    },
  })

  console.log("Created soil test requests")

  // Create soil test report
  await prisma.soilTestReport.create({
    data: {
      reportUrl: "https://example.com/reports/soil-report-123.pdf",
      soilCollectionUrl: "https://example.com/photos/soil-collection-123.jpg",
      farmerPhotoUrl: "https://example.com/photos/farmer-photo-123.jpg",
      requestId: soilRequest1.id,
      soilTesterId: soilTestCompany.id,
    },
  })

  console.log("Created soil test report")

  // Create market prices
  const crops = [
    { name: "Tomato", type: "SHORT_TERM" },
    { name: "Potato", type: "SHORT_TERM" },
    { name: "Rice", type: "SEASONAL" },
    { name: "Wheat", type: "SEASONAL" },
    { name: "Coconut", type: "LONG_TERM" },
    { name: "Mango", type: "LONG_TERM" },
  ]

  const markets = ["Ahmedabad APMC", "Surat Wholesale Market", "Vadodara Farmers Market"]

  // Create price data for the last 30 days
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    for (const crop of crops) {
      for (const market of markets) {
        // Add some randomness to prices to simulate market fluctuations
        const basePrice = crop.type === "SHORT_TERM" ? 20 : crop.type === "SEASONAL" ? 40 : 80
        const randomFactor = 0.8 + Math.random() * 0.4 // Between 0.8 and 1.2
        const price = basePrice * randomFactor

        await prisma.marketPrice.create({
          data: {
            cropName: crop.name,
            marketName: market,
            price: Number.parseFloat(price.toFixed(2)),
            date,
            cropType: crop.type,
            agentId: marketAgent.id,
          },
        })
      }
    }
  }

  console.log("Created market prices")

  // Create bidding entries
  const biddingEntry = await prisma.biddingEntry.create({
    data: {
      cropName: "Organic Tomatoes",
      basePrice: 25.5,
      imageUrl: "https://example.com/photos/tomatoes-123.jpg",
      contactNumber: "+91 9876543210",
      address: "North Field, Village Sundarpur, District Mehsana",
      isActive: true,
      endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      farmerId: farmer1.id,
    },
  })

  console.log("Created bidding entry")

  // Create bids
  await prisma.bid.create({
    data: {
      amount: 27.0,
      biddingEntryId: biddingEntry.id,
      buyerId: buyer.id,
    },
  })

  console.log("Created bid")

  // Create feedback
  await prisma.feedback.create({
    data: {
      rating: 5,
      comment: "Excellent quality produce, delivered on time. Will definitely buy again!",
      userId: farmer1.id, // Receiving feedback
      giverId: buyer.id, // Giving feedback
    },
  })

  console.log("Created feedback")

  console.log("Seed completed successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
