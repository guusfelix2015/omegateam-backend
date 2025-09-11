/*
  Warnings:

  - You are about to drop the column `CP` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "CP";

-- CreateTable
CREATE TABLE "company_parties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_parties" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyPartyId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_company_parties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_parties_name_key" ON "company_parties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_parties_userId_companyPartyId_key" ON "user_company_parties"("userId", "companyPartyId");

-- AddForeignKey
ALTER TABLE "user_company_parties" ADD CONSTRAINT "user_company_parties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_parties" ADD CONSTRAINT "user_company_parties_companyPartyId_fkey" FOREIGN KEY ("companyPartyId") REFERENCES "company_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
