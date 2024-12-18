-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "canPostCDME" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "lastName" TEXT;
