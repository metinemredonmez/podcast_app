-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'CREATOR', 'LISTENER');
CREATE TYPE "NotificationType" AS ENUM ('EPISODE_PUBLISHED', 'COMMENT_REPLY', 'SYSTEM');
CREATE TYPE "AnalyticsEventType" AS ENUM ('PODCAST_PLAY', 'PODCAST_COMPLETE', 'PODCAST_FOLLOW', 'PODCAST_SHARE', 'STREAM_JOIN');
CREATE TYPE "StreamStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- Create Tables
CREATE TABLE "Tenant" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'LISTENER',
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "User_tenantId_idx" ON "User" ("tenantId");

CREATE TABLE "Podcast" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "publishedAt" TIMESTAMPTZ,
    CONSTRAINT "Podcast_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Podcast_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Podcast_tenantId_slug_key" ON "Podcast" ("tenantId", "slug");
CREATE INDEX "Podcast_tenantId_idx" ON "Podcast" ("tenantId");
CREATE INDEX "Podcast_ownerId_idx" ON "Podcast" ("ownerId");

CREATE TABLE "Episode" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "podcastId" UUID NOT NULL,
    "hostId" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ,
    "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,
    "episodeNumber" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Episode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Episode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Episode_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Episode_podcastId_slug_key" ON "Episode" ("podcastId", "slug");
CREATE INDEX "Episode_tenantId_idx" ON "Episode" ("tenantId");
CREATE INDEX "Episode_podcastId_idx" ON "Episode" ("podcastId");
CREATE INDEX "Episode_publishedAt_idx" ON "Episode" ("publishedAt");

CREATE TABLE "Category" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Category_tenantId_slug_key" ON "Category" ("tenantId", "slug");
CREATE INDEX "Category_tenantId_idx" ON "Category" ("tenantId");

CREATE TABLE "PodcastCategory" (
    "podcastId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    CONSTRAINT "PodcastCategory_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PodcastCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("podcastId", "categoryId")
);

CREATE TABLE "Follow" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "podcastId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Follow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Follow_userId_podcastId_key" ON "Follow" ("userId", "podcastId");
CREATE INDEX "Follow_tenantId_idx" ON "Follow" ("tenantId");

CREATE TABLE "Comment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "episodeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "parentId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Comment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Comment_tenantId_idx" ON "Comment" ("tenantId");
CREATE INDEX "Comment_episodeId_idx" ON "Comment" ("episodeId");
CREATE INDEX "Comment_userId_idx" ON "Comment" ("userId");

CREATE TABLE "Notification" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Notification_tenantId_idx" ON "Notification" ("tenantId");
CREATE INDEX "Notification_userId_idx" ON "Notification" ("userId");
CREATE INDEX "Notification_type_idx" ON "Notification" ("type");

CREATE TABLE "AnalyticsEvent" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "podcastId" UUID,
    "episodeId" UUID,
    "eventType" "AnalyticsEventType" NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "AnalyticsEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AnalyticsEvent_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AnalyticsEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AnalyticsEvent_tenantId_idx" ON "AnalyticsEvent" ("tenantId");
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent" ("eventType");
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent" ("userId");

CREATE TABLE "ListeningProgress" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "episodeId" UUID NOT NULL,
    "progressSeconds" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT FALSE,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "ListeningProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListeningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListeningProgress_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ListeningProgress_userId_episodeId_key" ON "ListeningProgress" ("userId", "episodeId");
CREATE INDEX "ListeningProgress_tenantId_idx" ON "ListeningProgress" ("tenantId");

CREATE TABLE "Hoca" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "expertise" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Hoca_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Hoca_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Hoca_tenantId_idx" ON "Hoca" ("tenantId");
CREATE INDEX "Hoca_userId_idx" ON "Hoca" ("userId");

CREATE TABLE "StorageAsset" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "ownerId" UUID,
    "ownerType" TEXT,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "StorageAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "StorageAsset_tenantId_idx" ON "StorageAsset" ("tenantId");
CREATE INDEX "StorageAsset_ownerId_idx" ON "StorageAsset" ("ownerId");

CREATE TABLE "StreamingSession" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "podcastId" UUID,
    "episodeId" UUID,
    "status" "StreamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMPTZ,
    "endedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "StreamingSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StreamingSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StreamingSession_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StreamingSession_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "StreamingSession_tenantId_idx" ON "StreamingSession" ("tenantId");
CREATE INDEX "StreamingSession_hostId_idx" ON "StreamingSession" ("hostId");

-- Triggers to keep updatedAt in sync
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_user BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER set_updated_at_podcast BEFORE UPDATE ON "Podcast"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER set_updated_at_episode BEFORE UPDATE ON "Episode"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER set_updated_at_category BEFORE UPDATE ON "Category"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER set_updated_at_comment BEFORE UPDATE ON "Comment"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER set_updated_at_hoca BEFORE UPDATE ON "Hoca"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER set_updated_at_streaming BEFORE UPDATE ON "StreamingSession"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
