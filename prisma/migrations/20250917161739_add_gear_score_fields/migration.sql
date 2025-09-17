-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gear_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "owned_item_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
