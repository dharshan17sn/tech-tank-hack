import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import BiddingInterface from "./bidding-interface"

// Mock data for initial bidding entries
const initialBiddingEntries = [
  {
    id: '1',
    cropName: 'Wheat',
    basePrice: 2500,
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop',
    contactNumber: '+91 9876543210',
    address: '123 Farm Road, Village, District',
    isActive: true,
    endDate: new Date('2024-04-30'),
    farmer: {
      name: 'John Doe',
      companyName: 'Doe Farms'
    },
    bids: [
      { id: '1', amount: 2600, buyer: 'Buyer 1', date: new Date('2024-04-10') },
      { id: '2', amount: 2700, buyer: 'Buyer 2', date: new Date('2024-04-11') }
    ]
  },
  {
    id: '2',
    cropName: 'Rice',
    basePrice: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1516054575922-f0b8eeadec1a?q=80&w=1000&auto=format&fit=crop',
    contactNumber: '+91 9876543211',
    address: '456 Farm Lane, Town, District',
    isActive: true,
    endDate: new Date('2024-05-15'),
    farmer: {
      name: 'Jane Smith',
      companyName: 'Smith Farms'
    },
    bids: [
      { id: '3', amount: 3300, buyer: 'Buyer 3', date: new Date('2024-04-12') }
    ]
  }
];

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

  return (
    <BiddingInterface 
      userRole={user.role} 
      initialBiddingEntries={initialBiddingEntries}
    />
  )
}
