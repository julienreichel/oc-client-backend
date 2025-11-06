import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('in production environment', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const module: TestingModule = await Test.createTestingModule({
        providers: [ConfigService],
      }).compile();

      service = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should provide database configuration', () => {
      // When
      const dbConfig = service.database;

      // Then
      expect(dbConfig.url).toBe('postgresql://user:pass@localhost:5432/db');
      expect(dbConfig.hasDatabase).toBe(true);
    });

    it('should provide environment configuration', () => {
      // When
      const envConfig = service.environment;

      // Then
      expect(envConfig.nodeEnv).toBe('production');
      expect(envConfig.isProduction).toBe(true);
      expect(envConfig.isDevelopment).toBe(false);
    });

    it('should provide server configuration', () => {
      // When
      const serverConfig = service.server;

      // Then
      expect(serverConfig.port).toBe('3000');
    });
  });

  describe('in development environment without database', () => {
    it('should initialize successfully and warn about missing database', async () => {
      // Given
      process.env.NODE_ENV = 'development';
      delete process.env.DATABASE_URL;

      const loggerWarnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation();

      // When
      const module: TestingModule = await Test.createTestingModule({
        providers: [ConfigService],
      }).compile();

      service = module.get<ConfigService>(ConfigService);

      // Then
      expect(service).toBeDefined();
      expect(service.database.hasDatabase).toBe(false);
      expect(service.environment.isDevelopment).toBe(true);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Running in development mode without database - unit tests only',
      );

      loggerWarnSpy.mockRestore();
    });
  });

  describe('with invalid configuration', () => {
    it('should throw error when DATABASE_URL is required but missing in production', async () => {
      // Given
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      // Suppress expected error logs during test
      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      // When / Then
      await expect(
        Test.createTestingModule({
          providers: [ConfigService],
        }).compile(),
      ).rejects.toThrow(
        'Configuration validation failed: DATABASE_URL is required in production environment',
      );

      loggerErrorSpy.mockRestore();
    });

    it('should throw error when DATABASE_URL format is invalid', async () => {
      // Given
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'invalid-url';

      // Suppress expected error logs during test
      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      // When / Then
      await expect(
        Test.createTestingModule({
          providers: [ConfigService],
        }).compile(),
      ).rejects.toThrow(
        'Configuration validation failed: DATABASE_URL must be a valid PostgreSQL connection string',
      );

      loggerErrorSpy.mockRestore();
    });
  });
});
