/*
  Warnings:

  - The `status` column on the `Connection` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_senderId_fkey";

-- DropIndex
DROP INDEX "Connection_senderId_receiverId_key";

-- DropIndex
DROP INDEX "Connection_status_idx";

-- AlterTable
ALTER TABLE "Connection" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Connection_senderId_idx" ON "Connection"("senderId");

-- CreateIndex
CREATE INDEX "Connection_receiverId_idx" ON "Connection"("receiverId");

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
