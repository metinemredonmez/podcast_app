-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podcastId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHelpfulVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "isHelpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHelpfulVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledEpisode" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationQueue" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reportedBy" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "moderatedBy" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastCollaborator" (
    "id" TEXT NOT NULL,
    "podcastId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "PodcastCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_podcastId_idx" ON "Review"("podcastId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_podcastId_key" ON "Review"("userId", "podcastId");

-- CreateIndex
CREATE INDEX "ReviewHelpfulVote_reviewId_idx" ON "ReviewHelpfulVote"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewHelpfulVote_userId_idx" ON "ReviewHelpfulVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewHelpfulVote_userId_reviewId_key" ON "ReviewHelpfulVote"("userId", "reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledEpisode_episodeId_key" ON "ScheduledEpisode"("episodeId");

-- CreateIndex
CREATE INDEX "ScheduledEpisode_scheduledAt_idx" ON "ScheduledEpisode"("scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledEpisode_status_idx" ON "ScheduledEpisode"("status");

-- CreateIndex
CREATE INDEX "ModerationQueue_entityType_idx" ON "ModerationQueue"("entityType");

-- CreateIndex
CREATE INDEX "ModerationQueue_status_idx" ON "ModerationQueue"("status");

-- CreateIndex
CREATE INDEX "ModerationQueue_createdAt_idx" ON "ModerationQueue"("createdAt");

-- CreateIndex
CREATE INDEX "PodcastCollaborator_podcastId_idx" ON "PodcastCollaborator"("podcastId");

-- CreateIndex
CREATE INDEX "PodcastCollaborator_userId_idx" ON "PodcastCollaborator"("userId");

-- CreateIndex
CREATE INDEX "PodcastCollaborator_status_idx" ON "PodcastCollaborator"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastCollaborator_podcastId_userId_key" ON "PodcastCollaborator"("podcastId", "userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpfulVote" ADD CONSTRAINT "ReviewHelpfulVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpfulVote" ADD CONSTRAINT "ReviewHelpfulVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledEpisode" ADD CONSTRAINT "ScheduledEpisode_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationQueue" ADD CONSTRAINT "ModerationQueue_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationQueue" ADD CONSTRAINT "ModerationQueue_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastCollaborator" ADD CONSTRAINT "PodcastCollaborator_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastCollaborator" ADD CONSTRAINT "PodcastCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
