-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('HELMET', 'ARMOR', 'PANTS', 'BOOTS', 'GLOVES', 'NECKLACE', 'EARRING', 'RING', 'SHIELD', 'WEAPON');

-- CreateEnum
CREATE TYPE "ItemGrade" AS ENUM ('D', 'C', 'B', 'A', 'S');

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "grade" "ItemGrade" NOT NULL,
    "valor_gs_int" INTEGER NOT NULL,
    "valor_dkp" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_name_key" ON "items"("name");
