'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@prisma/client';

interface BiddingEntry {
  id: string;
  cropName: string;
  basePrice: number;
  imageUrl: string;
  contactNumber: string;
  address: string;
  isActive: boolean;
  endDate: Date;
  farmer: {
    name: string;
    companyName: string;
  };
  bids: {
    id: string;
    amount: number;
    buyer: string;
    date: Date;
  }[];
}

interface BiddingInterfaceProps {
  userRole: UserRole;
  initialBiddingEntries: BiddingEntry[];
}

export default function BiddingInterface({ userRole, initialBiddingEntries }: BiddingInterfaceProps) {
  const [mockBiddingEntries, setMockBiddingEntries] = useState<BiddingEntry[]>(initialBiddingEntries);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [newBid, setNewBid] = useState({
    cropName: '',
    basePrice: '',
    imageUrl: '',
    contactNumber: '',
    address: '',
    endDate: null as Date | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add new bid to mock data
    const newBidEntry: BiddingEntry = {
      id: String(mockBiddingEntries.length + 1),
      cropName: newBid.cropName,
      basePrice: Number(newBid.basePrice),
      imageUrl: newBid.imageUrl,
      contactNumber: newBid.contactNumber,
      address: newBid.address,
      isActive: true,
      endDate: newBid.endDate || new Date(),
      farmer: {
        name: 'Current User',
        companyName: 'My Farm'
      },
      bids: []
    };
    
    setMockBiddingEntries([...mockBiddingEntries, newBidEntry]);
    setIsSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePlaceBid = async (entryId: string) => {
    if (!bidAmount) return;
    
    const amount = parseFloat(bidAmount);
    const entry = mockBiddingEntries.find(e => e.id === entryId);
    
    if (!entry) return;
    
    if (amount <= entry.basePrice) {
      alert('Bid amount must be higher than base price');
      return;
    }
    
    const newBid = {
      id: String(entry.bids.length + 1),
      amount,
      buyer: 'Current User',
      date: new Date()
    };
    
    const updatedEntries = mockBiddingEntries.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          bids: [...entry.bids, newBid]
        };
      }
      return entry;
    });
    
    setMockBiddingEntries(updatedEntries);
    setSelectedBid(null);
    setBidAmount('');
  };

  if (userRole !== 'BUYER' && userRole !== 'FARMER') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Bidding Platform</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>This page is only accessible to buyers and farmers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bidding Platform</h1>
      
      {/* Bidding Entries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {mockBiddingEntries.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            <div className="relative h-48">
              <img
                src={entry.imageUrl}
                alt={entry.cropName}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>{entry.cropName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Base Price:</span> ₹{entry.basePrice}/quintal
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Farmer:</span> {entry.farmer.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Company:</span> {entry.farmer.companyName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Contact:</span> {entry.contactNumber}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Address:</span> {entry.address}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Bidding Ends:</span> {format(entry.endDate, 'PPP')}
                </p>
                {entry.bids.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Current Bids:</p>
                    <ul className="text-sm text-gray-600">
                      {entry.bids.map(bid => (
                        <li key={bid.id}>
                          ₹{bid.amount} by {bid.buyer} ({format(bid.date, 'MMM d, yyyy')})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {userRole === 'BUYER' && (
                  <div className="pt-4">
                    {selectedBid === entry.id ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Enter your bid amount"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1"
                            onClick={() => handlePlaceBid(entry.id)}
                          >
                            Submit Bid
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setSelectedBid(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => setSelectedBid(entry.id)}
                      >
                        Place Bid
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Bidding Entry Form (Only for Farmers) */}
      {userRole === 'FARMER' && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Bidding Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cropName">Crop Name</Label>
                <Input
                  id="cropName"
                  name="cropName"
                  required
                  placeholder="Enter crop name"
                  value={newBid.cropName}
                  onChange={(e) => setNewBid({...newBid, cropName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="basePrice">Base Price (₹/quintal)</Label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  required
                  placeholder="Enter base price"
                  value={newBid.basePrice}
                  onChange={(e) => setNewBid({...newBid, basePrice: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  required
                  placeholder="Enter image URL"
                  value={newBid.imageUrl}
                  onChange={(e) => setNewBid({...newBid, imageUrl: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  required
                  placeholder="Enter contact number"
                  value={newBid.contactNumber}
                  onChange={(e) => setNewBid({...newBid, contactNumber: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  required
                  placeholder="Enter your address"
                  value={newBid.address}
                  onChange={(e) => setNewBid({...newBid, address: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Bidding End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newBid.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newBid.endDate ? format(newBid.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newBid.endDate || undefined}
                      onSelect={(date) => setNewBid({...newBid, endDate: date || null})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Creating...' : 'Create Bidding Entry'}
              </Button>
              
              {showSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  Bidding entry created successfully!
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 