/*
  Warnings:

  - You are about to drop the column `biddingId` on the `Bid` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Bid` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Bid` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Bidding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Solution` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `biddingEntryId` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerId` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_biddingId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_userId_fkey";

-- DropForeignKey
ALTER TABLE "Bidding" DROP CONSTRAINT "Bidding_userId_fkey";

-- DropForeignKey
ALTER TABLE "Bidding" DROP CONSTRAINT "Bidding_winningBidId_fkey";

-- DropForeignKey
ALTER TABLE "Solution" DROP CONSTRAINT "Solution_cropFeedId_fkey";

-- DropForeignKey
ALTER TABLE "Solution" DROP CONSTRAINT "Solution_userId_fkey";

-- DropIndex
DROP INDEX "Bid_biddingId_idx";

-- DropIndex
DROP INDEX "Bid_userId_idx";

-- AlterTable
ALTER TABLE "Bid" DROP COLUMN "biddingId",
DROP COLUMN "status",
DROP COLUMN "userId",
ADD COLUMN     "biddingEntryId" TEXT NOT NULL,
ADD COLUMN     "buyerId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "image",
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;

-- DropTable
DROP TABLE "Bidding";

-- DropTable
DROP TABLE "Solution";

-- DropEnum
DROP TYPE "BidStatus";

-- DropEnum
DROP TYPE "BiddingStatus";

-- CreateTable
CREATE TABLE "BiddingEntry" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "farmerId" TEXT NOT NULL,
    "winningBidId" TEXT,

    CONSTRAINT "BiddingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BiddingEntry_winningBidId_key" ON "BiddingEntry"("winningBidId");

-- AddForeignKey
ALTER TABLE "BiddingEntry" ADD CONSTRAINT "BiddingEntry_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingEntry" ADD CONSTRAINT "BiddingEntry_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_biddingEntryId_fkey" FOREIGN KEY ("biddingEntryId") REFERENCES "BiddingEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
