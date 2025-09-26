-- AlterEnum
ALTER TYPE "ItemCategory" ADD VALUE 'COMUM';

-- CreateTable
CREATE TABLE "raid_dropped_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "grade" "ItemGrade" NOT NULL,
    "min_dkp_bid" INTEGER NOT NULL,
    "raid_instance_id" TEXT NOT NULL,
    "dropped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raid_dropped_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "raid_dropped_items" ADD CONSTRAINT "raid_dropped_items_raid_instance_id_fkey" FOREIGN KEY ("raid_instance_id") REFERENCES "raid_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
