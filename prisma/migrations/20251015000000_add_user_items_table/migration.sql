-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "enhancement_level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_items_user_id_idx" ON "user_items"("user_id");

-- CreateIndex
CREATE INDEX "user_items_item_id_idx" ON "user_items"("item_id");

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add check constraint for enhancement level (0-12)
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_enhancement_level_check" CHECK ("enhancement_level" >= 0 AND "enhancement_level" <= 12);

-- Migrate existing data from owned_item_ids to user_items
-- This creates UserItem records for all existing owned items with enhancement_level = 0
INSERT INTO "user_items" ("id", "user_id", "item_id", "enhancement_level", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    u.id,
    unnest(u.owned_item_ids),
    0,
    NOW(),
    NOW()
FROM "users" u
WHERE array_length(u.owned_item_ids, 1) > 0;

-- Note: We keep the owned_item_ids column for now as a safety measure
-- It can be removed in a future migration after verifying the system works correctly

