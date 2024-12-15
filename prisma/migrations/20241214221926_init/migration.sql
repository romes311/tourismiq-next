/*
  Warnings:

  - Added the required column `category` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('THOUGHT_LEADERSHIP', 'NEWS', 'EVENTS', 'BLOG_POSTS', 'BOOKS', 'COURSES', 'PODCASTS', 'PRESENTATIONS', 'PRESS_RELEASES', 'TEMPLATES', 'VIDEOS', 'WEBINARS', 'CASE_STUDIES', 'WHITEPAPERS');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "bookAuthor" TEXT,
ADD COLUMN     "bookISBN" TEXT,
ADD COLUMN     "bookPublishDate" TIMESTAMP(3),
ADD COLUMN     "bookPublisher" TEXT,
ADD COLUMN     "caseStudyCompany" TEXT,
ADD COLUMN     "caseStudyIndustry" TEXT,
ADD COLUMN     "courseDuration" TEXT,
ADD COLUMN     "courseInstructor" TEXT,
ADD COLUMN     "coursePlatform" TEXT,
ADD COLUMN     "courseSkillLevel" TEXT,
ADD COLUMN     "eventDate" TIMESTAMP(3),
ADD COLUMN     "eventLocation" TEXT,
ADD COLUMN     "eventRegistrationUrl" TEXT,
ADD COLUMN     "featuredImage" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "podcastHost" TEXT,
ADD COLUMN     "podcastPlatforms" TEXT[],
ADD COLUMN     "podcastUrl" TEXT,
ADD COLUMN     "presentationDate" TIMESTAMP(3),
ADD COLUMN     "presentationVenue" TEXT,
ADD COLUMN     "pressContactInfo" TEXT,
ADD COLUMN     "pressSource" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "templateFileType" TEXT,
ADD COLUMN     "templateFileUrl" TEXT,
ADD COLUMN     "videoDuration" INTEGER,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "whitepaperFileUrl" TEXT,
ADD COLUMN     "whitepaperTopics" TEXT[],
DROP COLUMN "category",
ADD COLUMN     "category" "PostCategory" NOT NULL;

-- CreateIndex
CREATE INDEX "Post_category_idx" ON "Post"("category");
