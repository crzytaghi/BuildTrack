/*
  Warnings:

  - Added the required column `companyId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
