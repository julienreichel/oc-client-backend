import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return health status with ok', () => {
      // Given
      const result = controller.check();

      // Then
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return a valid ISO timestamp', () => {
      // Given
      const result = controller.check();

      // Then
      const timestamp = new Date(result.timestamp);
      expect(timestamp.toISOString()).toBe(result.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
