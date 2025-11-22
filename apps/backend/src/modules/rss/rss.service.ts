import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

interface RssPodcast {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  owner: { name: string | null; email: string } | null;
  episodes: RssEpisode[];
}

interface RssEpisode {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  audioUrl: string | null;
  duration: number | null;
  publishedAt: Date | null;
  episodeNumber: number | null;
}

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);
  private readonly cacheTTL = CacheService.ttl.long; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private cacheKey(podcastSlug: string, tenantId: string): string {
    return `rss:${tenantId}:${podcastSlug}`;
  }

  async generateFeed(podcastSlug: string, tenantId: string): Promise<string> {
    const key = this.cacheKey(podcastSlug, tenantId);

    // Try cache first
    const cached = await this.cache.get<string>(key);
    if (cached) {
      this.logger.debug(`RSS feed cache hit for ${key}`);
      return cached;
    }

    // Fetch podcast with episodes
    const podcast = await this.prisma.podcast.findFirst({
      where: {
        slug: podcastSlug,
        tenantId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImageUrl: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        episodes: {
          where: { isPublished: true },
          orderBy: { publishedAt: 'desc' },
          take: 100, // Limit episodes in feed
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            audioUrl: true,
            duration: true,
            publishedAt: true,
            episodeNumber: true,
          },
        },
      },
    });

    if (!podcast) {
      throw new NotFoundException(`Podcast with slug '${podcastSlug}' not found`);
    }

    const xml = this.buildRssFeed(podcast as unknown as RssPodcast, tenantId);

    // Cache the result
    await this.cache.set(key, xml, this.cacheTTL);

    return xml;
  }

  async invalidateCache(podcastSlug: string, tenantId: string): Promise<void> {
    const key = this.cacheKey(podcastSlug, tenantId);
    await this.cache.del(key);
    this.logger.debug(`RSS feed cache invalidated for ${key}`);
  }

  async invalidateCacheByPodcastId(podcastId: string): Promise<void> {
    const podcast = await this.prisma.podcast.findUnique({
      where: { id: podcastId },
      select: { slug: true, tenantId: true },
    });

    if (podcast) {
      await this.invalidateCache(podcast.slug, podcast.tenantId);
    }
  }

  private buildRssFeed(podcast: RssPodcast, tenantId: string): string {
    const baseUrl = process.env.BASE_URL || 'https://api.example.com';
    const now = new Date().toUTCString();

    const escapeXml = (str: string | null | undefined): string => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const formatDuration = (seconds: number | null): string => {
      if (!seconds) return '00:00:00';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const items = podcast.episodes.map((ep) => `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <link>${baseUrl}/podcasts/${podcast.slug}/episodes/${ep.slug}</link>
      <guid isPermaLink="false">${ep.id}</guid>
      <description><![CDATA[${ep.description || ''}]]></description>
      ${ep.audioUrl ? `<enclosure url="${escapeXml(ep.audioUrl)}" type="audio/mpeg" />` : ''}
      ${ep.publishedAt ? `<pubDate>${new Date(ep.publishedAt).toUTCString()}</pubDate>` : ''}
      <itunes:duration>${formatDuration(ep.duration)}</itunes:duration>
      ${ep.episodeNumber ? `<itunes:episode>${ep.episodeNumber}</itunes:episode>` : ''}
    </item>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(podcast.title)}</title>
    <link>${baseUrl}/podcasts/${podcast.slug}</link>
    <description><![CDATA[${podcast.description || ''}]]></description>
    <language>tr-TR</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss/${podcast.slug}" rel="self" type="application/rss+xml"/>
    ${podcast.coverImageUrl ? `<image>
      <url>${escapeXml(podcast.coverImageUrl)}</url>
      <title>${escapeXml(podcast.title)}</title>
      <link>${baseUrl}/podcasts/${podcast.slug}</link>
    </image>
    <itunes:image href="${escapeXml(podcast.coverImageUrl)}"/>` : ''}
    ${podcast.owner ? `<itunes:author>${escapeXml(podcast.owner.name || 'Unknown')}</itunes:author>
    <itunes:owner>
      <itunes:name>${escapeXml(podcast.owner.name || 'Unknown')}</itunes:name>
      <itunes:email>${escapeXml(podcast.owner.email)}</itunes:email>
    </itunes:owner>` : ''}
    <itunes:explicit>false</itunes:explicit>
    ${items}
  </channel>
</rss>`;
  }
}
