import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../../../src/common/metrics/metrics.service';
import { getToken } from '@willsoto/nestjs-prometheus';

describe('MetricsService', () => {
  let service: MetricsService;
  let mockCounter: any;
  let mockHistogram: any;
  let mockGauge: any;

  beforeEach(async () => {
    mockCounter = {
      inc: jest.fn(),
    };

    mockHistogram = {
      observe: jest.fn(),
    };

    mockGauge = {
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: getToken('http_requests_total'),
          useValue: mockCounter,
        },
        {
          provide: getToken('http_request_duration_seconds'),
          useValue: mockHistogram,
        },
        {
          provide: getToken('active_users_total'),
          useValue: mockGauge,
        },
        {
          provide: getToken('podcast_plays_total'),
          useValue: mockCounter,
        },
        {
          provide: getToken('episode_plays_total'),
          useValue: mockCounter,
        },
        {
          provide: getToken('user_registrations_total'),
          useValue: mockCounter,
        },
        {
          provide: getToken('auth_attempts_total'),
          useValue: mockCounter,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('incrementHttpRequests', () => {
    it('should increment HTTP request counter with labels', () => {
      service.incrementHttpRequests('GET', '/api/test', 200);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        method: 'GET',
        route: '/api/test',
        status_code: 200,
      });
    });
  });

  describe('recordHttpDuration', () => {
    it('should record HTTP request duration', () => {
      service.recordHttpDuration('POST', '/api/login', 0.150);

      expect(mockHistogram.observe).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/api/login',
        },
        0.150,
      );
    });
  });

  describe('setActiveUsers', () => {
    it('should set active users gauge', () => {
      service.setActiveUsers(1250);

      expect(mockGauge.set).toHaveBeenCalledWith(1250);
    });
  });

  describe('incrementPodcastPlays', () => {
    it('should increment podcast plays counter', () => {
      const podcastId = 'podcast-123';

      service.incrementPodcastPlays(podcastId);

      expect(mockCounter.inc).toHaveBeenCalledWith({ podcast_id: podcastId });
    });
  });

  describe('incrementEpisodePlays', () => {
    it('should increment episode plays counter', () => {
      const episodeId = 'episode-456';

      service.incrementEpisodePlays(episodeId);

      expect(mockCounter.inc).toHaveBeenCalledWith({ episode_id: episodeId });
    });
  });

  describe('incrementUserRegistrations', () => {
    it('should increment user registrations counter', () => {
      service.incrementUserRegistrations();

      expect(mockCounter.inc).toHaveBeenCalled();
    });
  });

  describe('incrementAuthAttempts', () => {
    it('should increment auth attempts for successful login', () => {
      service.incrementAuthAttempts('login', true);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type: 'login',
        success: 'true',
      });
    });

    it('should increment auth attempts for failed login', () => {
      service.incrementAuthAttempts('login', false);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type: 'login',
        success: 'false',
      });
    });

    it('should increment auth attempts for register', () => {
      service.incrementAuthAttempts('register', true);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type: 'register',
        success: 'true',
      });
    });

    it('should increment auth attempts for refresh', () => {
      service.incrementAuthAttempts('refresh', true);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type: 'refresh',
        success: 'true',
      });
    });
  });
});
