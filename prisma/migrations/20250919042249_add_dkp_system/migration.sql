-- CreateEnum
CREATE TYPE "DkpTransactionType" AS ENUM ('RAID_REWARD', 'MANUAL_ADJUSTMENT', 'ITEM_PURCHASE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dkp_points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "raids" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boss_level" INTEGER NOT NULL,
    "base_score" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raid_instances" (
    "id" TEXT NOT NULL,
    "raid_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raid_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raid_participants" (
    "id" TEXT NOT NULL,
    "raid_instance_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gear_score_at_time" INTEGER NOT NULL,
    "dkp_awarded" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raid_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dkp_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "DkpTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "raid_instance_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dkp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raids_name_key" ON "raids"("name");

-- CreateIndex
CREATE UNIQUE INDEX "raid_participants_raid_instance_id_user_id_key" ON "raid_participants"("raid_instance_id", "user_id");

-- AddForeignKey
ALTER TABLE "raid_instances" ADD CONSTRAINT "raid_instances_raid_id_fkey" FOREIGN KEY ("raid_id") REFERENCES "raids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_participants" ADD CONSTRAINT "raid_participants_raid_instance_id_fkey" FOREIGN KEY ("raid_instance_id") REFERENCES "raid_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_participants" ADD CONSTRAINT "raid_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dkp_transactions" ADD CONSTRAINT "dkp_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dkp_transactions" ADD CONSTRAINT "dkp_transactions_raid_instance_id_fkey" FOREIGN KEY ("raid_instance_id") REFERENCES "raid_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
