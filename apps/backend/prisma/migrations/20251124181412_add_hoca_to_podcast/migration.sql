/*
  Warnings:

  - The values [SYSTEMa] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ownerId` on the `StorageAsset` table. All the data in the column will be lost.
  - You are about to drop the column `ownerType` on the `StorageAsset` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Hoca` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Download` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Favorite` table without a default value. This is not possible if the table is not empty.
  - Made the column `tenantId` on table `ModerationQueue` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tenantId` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `PlaylistEpisode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ReviewHelpfulVote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ScheduledEpisode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('EPISODE_PUBLISHED', 'COMMENT_REPLY', 'SYSTEM', 'NEW_FOLLOWER', 'MENTION');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "public"."StorageAsset_ownerId_idx";

-- DropIndex
DROP INDEX IF EXISTS "public"."StorageAsset_ownerType_idx";

-- Drop constraint first, then index
ALTER TABLE "public"."User" DROP CONSTRAINT IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "public"."User_email_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Download" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "ModerationQueue" ADD COLUMN     "commentId" TEXT,
ADD COLUMN     "episodeId" TEXT,
ADD COLUMN     "podcastId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "episodeId" TEXT,
ADD COLUMN     "podcastId" TEXT;

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "PlaylistEpisode" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Podcast" ADD COLUMN     "hocaId" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "ReviewHelpfulVote" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "ScheduledEpisode" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "StorageAsset" DROP COLUMN "ownerId",
DROP COLUMN "ownerType",
ADD COLUMN     "episodeId" TEXT,
ADD COLUMN     "hocaId" TEXT,
ADD COLUMN     "podcastId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "Comment_tenantId_episodeId_createdAt_idx" ON "Comment"("tenantId", "episodeId", "createdAt");

-- CreateIndex
CREATE INDEX "Download_tenantId_idx" ON "Download"("tenantId");

-- CreateIndex
CREATE INDEX "Download_tenantId_userId_status_idx" ON "Download"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "Episode_tenantId_isPublished_idx" ON "Episode"("tenantId", "isPublished");

-- CreateIndex
CREATE INDEX "Episode_podcastId_isPublished_idx" ON "Episode"("podcastId", "isPublished");

-- CreateIndex
CREATE INDEX "Favorite_tenantId_idx" ON "Favorite"("tenantId");

-- CreateIndex
CREATE INDEX "Favorite_tenantId_userId_createdAt_idx" ON "Favorite"("tenantId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "Follow_tenantId_userId_idx" ON "Follow"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Follow_tenantId_podcastId_idx" ON "Follow"("tenantId", "podcastId");

-- CreateIndex
CREATE UNIQUE INDEX "Hoca_userId_key" ON "Hoca"("userId");

-- CreateIndex
CREATE INDEX "ListeningProgress_tenantId_userId_lastPlayedAt_idx" ON "ListeningProgress"("tenantId", "userId", "lastPlayedAt");

-- CreateIndex
CREATE INDEX "ListeningProgress_tenantId_episodeId_idx" ON "ListeningProgress"("tenantId", "episodeId");

-- CreateIndex
CREATE INDEX "ModerationQueue_podcastId_idx" ON "ModerationQueue"("podcastId");

-- CreateIndex
CREATE INDEX "ModerationQueue_episodeId_idx" ON "ModerationQueue"("episodeId");

-- CreateIndex
CREATE INDEX "ModerationQueue_commentId_idx" ON "ModerationQueue"("commentId");

-- CreateIndex
CREATE INDEX "Notification_podcastId_idx" ON "Notification"("podcastId");

-- CreateIndex
CREATE INDEX "Notification_episodeId_idx" ON "Notification"("episodeId");

-- CreateIndex
CREATE INDEX "Playlist_tenantId_idx" ON "Playlist"("tenantId");

-- CreateIndex
CREATE INDEX "PlaylistEpisode_tenantId_idx" ON "PlaylistEpisode"("tenantId");

-- CreateIndex
CREATE INDEX "Podcast_hocaId_idx" ON "Podcast"("hocaId");

-- CreateIndex
CREATE INDEX "Podcast_tenantId_isPublished_idx" ON "Podcast"("tenantId", "isPublished");

-- CreateIndex
CREATE INDEX "PodcastCategory_podcastId_idx" ON "PodcastCategory"("podcastId");

-- CreateIndex
CREATE INDEX "PodcastCollaborator_invitedBy_idx" ON "PodcastCollaborator"("invitedBy");

-- CreateIndex
CREATE INDEX "Review_tenantId_idx" ON "Review"("tenantId");

-- CreateIndex
CREATE INDEX "Review_tenantId_podcastId_rating_idx" ON "Review"("tenantId", "podcastId", "rating");

-- CreateIndex
CREATE INDEX "ReviewHelpfulVote_tenantId_idx" ON "ReviewHelpfulVote"("tenantId");

-- CreateIndex
CREATE INDEX "ScheduledEpisode_tenantId_idx" ON "ScheduledEpisode"("tenantId");

-- CreateIndex
CREATE INDEX "StorageAsset_userId_idx" ON "StorageAsset"("userId");

-- CreateIndex
CREATE INDEX "StorageAsset_podcastId_idx" ON "StorageAsset"("podcastId");

-- CreateIndex
CREATE INDEX "StorageAsset_episodeId_idx" ON "StorageAsset"("episodeId");

-- CreateIndex
CREATE INDEX "StorageAsset_hocaId_idx" ON "StorageAsset"("hocaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "Podcast" ADD CONSTRAINT "Podcast_hocaId_fkey" FOREIGN KEY ("hocaId") REFERENCES "Hoca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageAsset" ADD CONSTRAINT "StorageAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageAsset" ADD CONSTRAINT "StorageAsset_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageAsset" ADD CONSTRAINT "StorageAsset_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageAsset" ADD CONSTRAINT "StorageAsset_hocaId_fkey" FOREIGN KEY ("hocaId") REFERENCES "Hoca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistEpisode" ADD CONSTRAINT "PlaylistEpisode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpfulVote" ADD CONSTRAINT "ReviewHelpfulVote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledEpisode" ADD CONSTRAINT "ScheduledEpisode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationQueue" ADD CONSTRAINT "ModerationQueue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationQueue" ADD CONSTRAINT "ModerationQueue_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationQueue" ADD CONSTRAINT "ModerationQueue_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationQueue" ADD CONSTRAINT "ModerationQueue_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastCollaborator" ADD CONSTRAINT "PodcastCollaborator_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
