-- Add class_bonus_applied field to dkp_transactions table
ALTER TABLE "dkp_transactions" ADD COLUMN "class_bonus_applied" BOOLEAN NOT NULL DEFAULT false;

-- Add class_bonus_applied field to raid_participants table
ALTER TABLE "raid_participants" ADD COLUMN "class_bonus_applied" BOOLEAN NOT NULL DEFAULT false;
