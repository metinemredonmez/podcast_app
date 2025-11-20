import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total') private readonly httpRequestsTotal: Counter,
    @InjectMetric('http_request_duration_seconds') private readonly httpRequestDuration: Histogram,
    @InjectMetric('active_users_total') private readonly activeUsersTotal: Gauge,
    @InjectMetric('podcast_plays_total') private readonly podcastPlaysTotal: Counter,
    @InjectMetric('episode_plays_total') private readonly episodePlaysTotal: Counter,
    @InjectMetric('user_registrations_total') private readonly userRegistrationsTotal: Counter,
    @InjectMetric('auth_attempts_total') private readonly authAttemptsTotal: Counter,
  ) {}

  /**
   * Increment HTTP request counter
   */
  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });
  }

  /**
   * Record HTTP request duration
   */
  recordHttpDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe(
      {
        method,
        route,
      },
      duration,
    );
  }

  /**
   * Set active users gauge
   */
  setActiveUsers(count: number) {
    this.activeUsersTotal.set(count);
  }

  /**
   * Increment podcast plays
   */
  incrementPodcastPlays(podcastId: string) {
    this.podcastPlaysTotal.inc({ podcast_id: podcastId });
  }

  /**
   * Increment episode plays
   */
  incrementEpisodePlays(episodeId: string) {
    this.episodePlaysTotal.inc({ episode_id: episodeId });
  }

  /**
   * Increment user registrations
   */
  incrementUserRegistrations() {
    this.userRegistrationsTotal.inc();
  }

  /**
   * Increment auth attempts
   */
  incrementAuthAttempts(type: 'login' | 'register' | 'refresh', success: boolean) {
    this.authAttemptsTotal.inc({
      type,
      success: success ? 'true' : 'false',
    });
  }
}
