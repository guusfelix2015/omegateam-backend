-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('PENDING', 'ACTIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuctionItemStatus" AS ENUM ('WAITING', 'IN_AUCTION', 'SOLD', 'NO_BIDS', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('ACTIVE', 'OUTBID', 'WON', 'CANCELLED');

-- AlterTable
ALTER TABLE "raid_dropped_items" ADD COLUMN "has_been_auctioned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "dkp_transactions" ADD COLUMN "auction_item_id" TEXT;

-- CreateTable
CREATE TABLE "auctions" (
    "id" TEXT NOT NULL,
    "status" "AuctionStatus" NOT NULL DEFAULT 'PENDING',
    "default_timer_seconds" INTEGER NOT NULL DEFAULT 20,
    "min_bid_increment" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_items" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "raid_dropped_item_id" TEXT NOT NULL,
    "status" "AuctionItemStatus" NOT NULL DEFAULT 'WAITING',
    "min_bid" INTEGER NOT NULL,
    "current_bid" INTEGER,
    "current_winner_id" TEXT,
    "time_remaining" INTEGER,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "auction_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dkp_transactions" ADD CONSTRAINT "dkp_transactions_auction_item_id_fkey" FOREIGN KEY ("auction_item_id") REFERENCES "auction_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_items" ADD CONSTRAINT "auction_items_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_items" ADD CONSTRAINT "auction_items_raid_dropped_item_id_fkey" FOREIGN KEY ("raid_dropped_item_id") REFERENCES "raid_dropped_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_items" ADD CONSTRAINT "auction_items_current_winner_id_fkey" FOREIGN KEY ("current_winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_item_id_fkey" FOREIGN KEY ("auction_item_id") REFERENCES "auction_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

