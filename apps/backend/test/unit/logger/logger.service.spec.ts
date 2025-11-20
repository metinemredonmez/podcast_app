import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppLoggerService } from '../../../src/common/logger/logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let mockLogger: any;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AppLoggerService>(AppLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should log info message', () => {
      const message = 'Test info message';
      const context = 'TestContext';

      service.log(message, context);

      expect(mockLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should log info message with metadata', () => {
      const message = 'Test message';
      const context = 'TestContext';
      const metadata = { userId: '123', action: 'test' };

      service.log(message, context, metadata);

      expect(mockLogger.info).toHaveBeenCalledWith(message, {
        context,
        userId: '123',
        action: 'test',
      });
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      const message = 'Test error';
      const trace = 'Error stack trace';
      const context = 'TestContext';

      service.error(message, trace, context);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        context,
        trace,
      });
    });

    it('should log error with metadata', () => {
      const message = 'Test error';
      const trace = 'Stack trace';
      const context = 'ErrorContext';
      const metadata = { errorCode: 500 };

      service.error(message, trace, context, metadata);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        context,
        trace,
        errorCode: 500,
      });
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const message = 'Test warning';
      const context = 'WarnContext';

      service.warn(message, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      const message = 'Debug info';
      const context = 'DebugContext';

      service.debug(message, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('verbose', () => {
    it('should log verbose message', () => {
      const message = 'Verbose info';
      const context = 'VerboseContext';

      service.verbose(message, context);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request', () => {
      const method = 'GET';
      const url = '/api/test';
      const statusCode = 200;
      const duration = 150;

      service.logRequest(method, url, statusCode, duration);

      expect(mockLogger.info).toHaveBeenCalledWith('HTTP Request', {
        context: 'HTTP',
        method,
        url,
        statusCode,
        duration: '150ms',
      });
    });

    it('should log HTTP request with metadata', () => {
      const metadata = { userId: 'user-123', ip: '127.0.0.1' };

      service.logRequest('POST', '/api/login', 200, 250, metadata);

      expect(mockLogger.info).toHaveBeenCalledWith('HTTP Request', {
        context: 'HTTP',
        method: 'POST',
        url: '/api/login',
        statusCode: 200,
        duration: '250ms',
        userId: 'user-123',
        ip: '127.0.0.1',
      });
    });
  });

  describe('logQuery', () => {
    it('should log database query', () => {
      const query = 'SELECT * FROM users';
      const duration = 25;

      service.logQuery(query, duration);

      expect(mockLogger.debug).toHaveBeenCalledWith('Database Query', {
        context: 'Database',
        query,
        duration: '25ms',
      });
    });
  });

  describe('logAuth', () => {
    it('should log authentication event', () => {
      const event = 'login';
      const userId = 'user-123';
      const email = 'test@example.com';

      service.logAuth(event, userId, email);

      expect(mockLogger.info).toHaveBeenCalledWith('Authentication Event', {
        context: 'Auth',
        event,
        userId,
        email,
      });
    });
  });

  describe('logMetric', () => {
    it('should log business metric', () => {
      const metric = 'user_registrations';
      const value = 42;

      service.logMetric(metric, value);

      expect(mockLogger.info).toHaveBeenCalledWith('Business Metric', {
        context: 'Metrics',
        metric,
        value,
      });
    });
  });
});
