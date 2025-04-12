/*
  Warnings:

  - You are about to drop the column `biddingEntryId` on the `Bid` table. All the data in the column will be lost.
  - You are about to drop the column `buyerId` on the `Bid` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Bid` table. All the data in the column will be lost.
  - You are about to drop the `BiddingEntry` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `biddingId` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Bid` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BiddingStatus" AS ENUM ('ACTIVE', 'CLOSED', 'SOLD');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_biddingEntryId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "BiddingEntry" DROP CONSTRAINT "BiddingEntry_farmerId_fkey";

-- DropForeignKey
ALTER TABLE "BiddingEntry" DROP CONSTRAINT "BiddingEntry_winningBidId_fkey";

-- AlterTable
ALTER TABLE "Bid" DROP COLUMN "biddingEntryId",
DROP COLUMN "buyerId",
DROP COLUMN "updatedAt",
ADD COLUMN     "biddingId" TEXT NOT NULL,
ADD COLUMN     "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'FARMER';

-- DropTable
DROP TABLE "BiddingEntry";

-- CreateTable
CREATE TABLE "Bidding" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "status" "BiddingStatus" NOT NULL DEFAULT 'ACTIVE',
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "winningBidId" TEXT,

    CONSTRAINT "Bidding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bidding_winningBidId_key" ON "Bidding"("winningBidId");

-- CreateIndex
CREATE INDEX "Bidding_userId_idx" ON "Bidding"("userId");

-- CreateIndex
CREATE INDEX "Bid_biddingId_idx" ON "Bid"("biddingId");

-- CreateIndex
CREATE INDEX "Bid_userId_idx" ON "Bid"("userId");

-- AddForeignKey
ALTER TABLE "Bidding" ADD CONSTRAINT "Bidding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bidding" ADD CONSTRAINT "Bidding_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES "Bidding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
