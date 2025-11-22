/*
  Warnings:

  - You are about to drop the column `changes` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to alter the column `description` on the `Category` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - You are about to drop the column `podcastId` on the `Comment` table. All the data in the column will be lost.
  - You are about to alter the column `content` on the `Comment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(5000)`.
  - The `status` column on the `Download` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `reason` on the `ModerationQueue` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - The `status` column on the `ModerationQueue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `name` on the `Playlist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `description` on the `Playlist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - The `role` column on the `PodcastCollaborator` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PodcastCollaborator` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `rating` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `title` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `content` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(5000)`.
  - The `status` column on the `ScheduledEpisode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `bio` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - A unique constraint covering the columns `[userId,podcastId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,episodeId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bucket,objectKey]` on the table `StorageAsset` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DownloadStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('CO_HOST', 'EDITOR', 'CONTRIBUTOR', 'GUEST');

-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'REMOVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnalyticsEventType" ADD VALUE 'EPISODE_DOWNLOAD';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SEARCH_QUERY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEW_FOLLOWER';
ALTER TYPE "NotificationType" ADD VALUE 'MENTION';

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_podcastId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Podcast" DROP CONSTRAINT "Podcast_ownerId_fkey";

-- DropIndex
DROP INDEX "public"."Favorite_userId_podcastId_episodeId_key";

-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "changes",
ADD COLUMN     "newValues" JSONB,
ADD COLUMN     "oldValues" JSONB;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "iconUrl" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "description" SET DATA TYPE VARCHAR(1000);

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "podcastId",
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "content" SET DATA TYPE VARCHAR(5000);

-- AlterTable
ALTER TABLE "Download" ADD COLUMN     "errorMessage" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "DownloadStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "EmailVerification" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "audioMimeType" TEXT DEFAULT 'audio/mpeg',
ADD COLUMN     "isExplicit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seasonNumber" INTEGER;

-- AlterTable
ALTER TABLE "Hoca" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "ListeningProgress" ADD COLUMN     "lastPlayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "playCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ModerationQueue" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenantId" TEXT,
ALTER COLUMN "reason" SET DATA TYPE VARCHAR(1000),
DROP COLUMN "status",
ADD COLUMN     "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "PasswordReset" ADD COLUMN     "ipAddress" TEXT;

-- AlterTable
ALTER TABLE "Playlist" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "Podcast" ADD COLUMN     "isExplicit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT DEFAULT 'tr';

-- AlterTable
ALTER TABLE "PodcastCollaborator" ADD COLUMN     "invitedBy" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "CollaboratorRole" NOT NULL DEFAULT 'CONTRIBUTOR',
DROP COLUMN "status",
ADD COLUMN     "status" "CollaboratorStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "rating" SET DATA TYPE SMALLINT,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "content" SET DATA TYPE VARCHAR(5000);

-- AlterTable
ALTER TABLE "ScheduledEpisode" ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "StorageAsset" ALTER COLUMN "sizeBytes" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "StreamingSession" ADD COLUMN     "description" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT,
ADD COLUMN     "viewerCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "settings" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "bio" SET DATA TYPE VARCHAR(500);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_podcastId_idx" ON "AnalyticsEvent"("podcastId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_episodeId_idx" ON "AnalyticsEvent"("episodeId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_tenantId_eventType_occurredAt_idx" ON "AnalyticsEvent"("tenantId", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Download_status_idx" ON "Download"("status");

-- CreateIndex
CREATE INDEX "Episode_hostId_idx" ON "Episode"("hostId");

-- CreateIndex
CREATE INDEX "Episode_isPublished_idx" ON "Episode"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_user_podcast_unique" ON "Favorite"("userId", "podcastId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_user_episode_unique" ON "Favorite"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "Follow_userId_idx" ON "Follow"("userId");

-- CreateIndex
CREATE INDEX "Follow_podcastId_idx" ON "Follow"("podcastId");

-- CreateIndex
CREATE INDEX "Hoca_isActive_idx" ON "Hoca"("isActive");

-- CreateIndex
CREATE INDEX "ListeningProgress_userId_idx" ON "ListeningProgress"("userId");

-- CreateIndex
CREATE INDEX "ListeningProgress_lastPlayedAt_idx" ON "ListeningProgress"("lastPlayedAt");

-- CreateIndex
CREATE INDEX "ModerationQueue_tenantId_idx" ON "ModerationQueue"("tenantId");

-- CreateIndex
CREATE INDEX "ModerationQueue_entityId_idx" ON "ModerationQueue"("entityId");

-- CreateIndex
CREATE INDEX "ModerationQueue_status_idx" ON "ModerationQueue"("status");

-- CreateIndex
CREATE INDEX "ModerationQueue_priority_idx" ON "ModerationQueue"("priority");

-- CreateIndex
CREATE INDEX "ModerationQueue_entityType_status_idx" ON "ModerationQueue"("entityType", "status");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Podcast_isPublished_idx" ON "Podcast"("isPublished");

-- CreateIndex
CREATE INDEX "Podcast_publishedAt_idx" ON "Podcast"("publishedAt");

-- CreateIndex
CREATE INDEX "PodcastCategory_categoryId_idx" ON "PodcastCategory"("categoryId");

-- CreateIndex
CREATE INDEX "PodcastCollaborator_status_idx" ON "PodcastCollaborator"("status");

-- CreateIndex
CREATE INDEX "Review_isPublic_idx" ON "Review"("isPublic");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "ScheduledEpisode_status_idx" ON "ScheduledEpisode"("status");

-- CreateIndex
CREATE INDEX "ScheduledEpisode_status_scheduledAt_idx" ON "ScheduledEpisode"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "StorageAsset_ownerType_idx" ON "StorageAsset"("ownerType");

-- CreateIndex
CREATE INDEX "StorageAsset_bucket_idx" ON "StorageAsset"("bucket");

-- CreateIndex
CREATE UNIQUE INDEX "StorageAsset_bucket_objectKey_key" ON "StorageAsset"("bucket", "objectKey");

-- CreateIndex
CREATE INDEX "StreamingSession_status_idx" ON "StreamingSession"("status");

-- CreateIndex
CREATE INDEX "StreamingSession_scheduledAt_idx" ON "StreamingSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_isActive_idx" ON "Tenant"("isActive");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- AddForeignKey
ALTER TABLE "Podcast" ADD CONSTRAINT "Podcast_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
