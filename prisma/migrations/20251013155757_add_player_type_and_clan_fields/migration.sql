-- CreateEnum
CREATE TYPE "PlayerType" AS ENUM ('PVP', 'PVE');

-- CreateEnum
CREATE TYPE "Clan" AS ENUM ('CLA1', 'CLA2');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clan" "Clan",
ADD COLUMN     "player_type" "PlayerType";
