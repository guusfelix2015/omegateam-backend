/*
  Warnings:

  - A unique constraint covering the columns `[nickname]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nickname` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PLAYER');

-- AlterTable - Add columns with defaults first
ALTER TABLE "users" ADD COLUMN     "CP" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lvl" INTEGER NOT NULL DEFAULT 1;

-- Add nickname column with temporary default
ALTER TABLE "users" ADD COLUMN     "nickname" TEXT;

-- Add role column with temporary default
ALTER TABLE "users" ADD COLUMN     "role" "UserRole";

-- Update existing users with appropriate values
UPDATE "users" SET
  "nickname" = CASE
    WHEN "email" = 'admin@lineage.com' THEN 'Admin'
    WHEN "email" = 'john.doe@example.com' THEN 'JohnDoe'
    WHEN "email" = 'jane.smith@example.com' THEN 'JaneSmith'
    ELSE CONCAT('User', SUBSTRING("id", 1, 8))
  END,
  "role" = CASE
    WHEN "email" = 'admin@lineage.com' THEN 'ADMIN'::"UserRole"
    ELSE 'PLAYER'::"UserRole"
  END;

-- Now make the columns required
ALTER TABLE "users" ALTER COLUMN "nickname" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");
