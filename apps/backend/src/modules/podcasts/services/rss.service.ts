import { Injectable, NotFoundException } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import { PodcastsService } from '../podcasts.service';
import { EpisodesService } from '../../episodes/episodes.service';

@Injectable()
export class RssService {
  constructor(
    private readonly podcastsService: PodcastsService,
    private readonly episodesService: EpisodesService,
  ) {}

  async generatePodcastRssFeed(podcastId: string, tenantId: string): Promise<string> {
    // Get podcast details
    const podcast = await this.podcastsService.findOne(podcastId, {
      userId: 'system',
      tenantId,
      role: 'ADMIN',
    } as any);

    if (!podcast) {
      throw new NotFoundException('Podcast not found');
    }

    // Get all published episodes for this podcast
    const episodesResult = await this.episodesService.findAll(
      {
        limit: 1000, // Get all episodes
        orderBy: 'publishedAt',
        orderDirection: 'desc',
      },
      {
        userId: 'system',
        tenantId,
        role: 'ADMIN',
      } as any,
    );

    // Filter by podcast ID and published status
    const publishedEpisodes = episodesResult.data.filter(
      (ep: any) => ep.podcastId === podcastId && ep.isPublished
    );

    // Build RSS feed
    const rssObject = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
      },
      rss: {
        '@_version': '2.0',
        '@_xmlns:itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        '@_xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
        '@_xmlns:atom': 'http://www.w3.org/2005/Atom',
        channel: {
          // Required channel elements
          title: podcast.title,
          link: `${process.env.FRONTEND_URL || 'https://podcast.app'}/podcasts/${podcast.slug}`,
          description: podcast.description || '',
          language: 'en', // TODO: Make this dynamic based on podcast settings

          // iTunes specific tags
          'itunes:author': podcast.ownerName || 'Podcast App',
          'itunes:summary': podcast.description || '',
          'itunes:type': 'episodic', // or 'serial'
          'itunes:owner': {
            'itunes:name': podcast.ownerName || 'Podcast App',
            'itunes:email': process.env.EMAIL_FROM || 'noreply@podcast.app',
          },
          'itunes:image': {
            '@_href': podcast.coverImageUrl || '',
          },
          'itunes:category': {
            '@_text': podcast.categoryName || 'General',
          },
          'itunes:explicit': 'no', // TODO: Add explicit flag to podcast model

          // Atom self-reference
          'atom:link': {
            '@_href': `${process.env.BACKEND_URL || 'https://api.podcast.app'}/api/podcasts/${podcastId}/rss.xml`,
            '@_rel': 'self',
            '@_type': 'application/rss+xml',
          },

          // Copyright
          copyright: `© ${new Date().getFullYear()} ${podcast.ownerName || 'Podcast App'}`,

          // Last build date
          lastBuildDate: new Date().toUTCString(),
          pubDate: podcast.publishedAt ? new Date(podcast.publishedAt).toUTCString() : new Date().toUTCString(),

          // Episodes
          item: publishedEpisodes.map((episode: any) => ({
            title: episode.title,
            description: episode.description || '',
            'itunes:summary': episode.description || '',
            link: `${process.env.FRONTEND_URL || 'https://podcast.app'}/episodes/${episode.slug}`,
            guid: {
              '@_isPermaLink': 'true',
              '#text': `${process.env.FRONTEND_URL || 'https://podcast.app'}/episodes/${episode.slug}`,
            },
            pubDate: episode.publishedAt ? new Date(episode.publishedAt).toUTCString() : new Date().toUTCString(),
            enclosure: {
              '@_url': episode.audioUrl,
              '@_type': 'audio/mpeg', // TODO: Detect actual audio type
              '@_length': episode.fileSize || 0,
            },
            'itunes:duration': this.formatDuration(episode.duration),
            'itunes:explicit': 'no', // TODO: Add explicit flag to episode model
            'itunes:episodeType': 'full', // or 'trailer', 'bonus'
            'itunes:image': {
              '@_href': episode.coverImageUrl || podcast.coverImageUrl || '',
            },
          })),
        },
      },
    };

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      indentBy: '  ',
    });

    return builder.build(rssObject);
  }

  /**
   * Format duration from seconds to HH:MM:SS format
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
}
