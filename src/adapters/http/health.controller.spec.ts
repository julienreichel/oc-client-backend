import { Test, TestingModule } from '@nestjs/testing';
import { HealthController, DatabaseConnectionError } from './health.controller';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../infrastructure/services/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockConfigService = {
    database: {
      hasDatabase: true,
    },
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/health endpoint', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should return health status ok without database ping', () => {
      // When
      const result = controller.health();

      // Then
      expect(result).toEqual({
        status: 'ok',
      });
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('/ready endpoint', () => {
    describe('when database is not configured', () => {
      beforeEach(() => {
        mockConfigService.database.hasDatabase = false;
      });

      it('should return ready with not-configured database status', async () => {
        // When
        const result = await controller.readiness();

        // Then
        expect(result).toEqual({
          status: 'ready',
          database: 'not-configured',
        });
        expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
      });
    });

    describe('when database is configured', () => {
      beforeEach(() => {
        mockConfigService.database.hasDatabase = true;
      });

      it('should return ready with connected database when ping succeeds', async () => {
        // Given
        mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

        // When
        const result = await controller.readiness();

        // Then
        expect(result).toEqual({
          status: 'ready',
          database: 'connected',
        });
        expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
          expect.arrayContaining([expect.stringContaining('SELECT 1')]),
        );
      });

      it('should throw DatabaseConnectionError when database ping fails', async () => {
        // Given
        const dbError = new Error('Connection refused');
        mockPrismaService.$queryRaw.mockRejectedValue(dbError);

        // When / Then
        await expect(controller.readiness()).rejects.toThrow(
          DatabaseConnectionError,
        );
        await expect(controller.readiness()).rejects.toThrow(
          'Database connection failed',
        );

        expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
          expect.arrayContaining([expect.stringContaining('SELECT 1')]),
        );
      });
    });
  });
});
