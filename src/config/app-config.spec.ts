import { AppConfig } from './app-config';

describe('AppConfig', () => {
  describe('when NODE_ENV is production', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should require DATABASE_URL in production', () => {
      // Given
      delete process.env.DATABASE_URL;
      const config = new AppConfig();

      // When
      const result = config.validate();

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'DATABASE_URL is required in production environment',
      );
    });

    it('should pass validation with valid DATABASE_URL', () => {
      // Given
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      const config = new AppConfig();

      // When
      const result = config.validate();

      // Then
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(config.hasDatabase()).toBe(true);
      expect(config.isProduction()).toBe(true);
    });

    it('should reject invalid DATABASE_URL format', () => {
      // Given
      process.env.DATABASE_URL = 'invalid-url';
      const config = new AppConfig();

      // When
      const result = config.validate();

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'DATABASE_URL must be a valid PostgreSQL connection string',
      );
    });
  });

  describe('when NODE_ENV is development', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should allow missing DATABASE_URL in development', () => {
      // Given
      delete process.env.DATABASE_URL;
      const config = new AppConfig();

      // When
      const result = config.validate();

      // Then
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(config.hasDatabase()).toBe(false);
      expect(config.isDevelopment()).toBe(true);
    });

    it('should pass with valid DATABASE_URL when provided', () => {
      // Given
      process.env.DATABASE_URL = 'postgres://app:pass@localhost:5432/db';
      const config = new AppConfig();

      // When
      const result = config.validate();

      // Then
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(config.hasDatabase()).toBe(true);
    });
  });

  describe('when NODE_ENV is test', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should allow missing DATABASE_URL in test environment', () => {
      // Given
      delete process.env.DATABASE_URL;
      const config = new AppConfig();

      // When
      const result = config.validate();

      // Then
      expect(result.isValid).toBe(true);
      expect(config.isDevelopment()).toBe(true);
      expect(config.hasDatabase()).toBe(false);
    });
  });

  describe('default values', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.DATABASE_URL;
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use default values when environment variables are not set', () => {
      // Given / When
      const config = new AppConfig();

      // Then
      expect(config.NODE_ENV).toBe('development');
      expect(config.PORT).toBe('3000');
      expect(config.DATABASE_URL).toBeUndefined();
      expect(config.isDevelopment()).toBe(true);
      expect(config.isProduction()).toBe(false);
    });
  });
});
