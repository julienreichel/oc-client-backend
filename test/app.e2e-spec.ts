import { INestApplication } from '@nestjs/common';
import {
  createApp,
  createRequest,
  resetDb,
  teardownHarness,
} from './e2e/harness';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof createRequest>;

  beforeAll(async () => {
    app = await createApp();
    request = createRequest(app);
  });

  afterEach(async () => {
    await resetDb(app);
  });

  afterAll(async () => {
    await app?.close();
    await teardownHarness();
  });

  describe('/api/health', () => {
    it('should return ok status with timestamp', async () => {
      // Given: A running application
      // When: Requesting the health endpoint
      const response = await request.get('/api/health').expect(200);

      // Then: Should return health status
      const body = response.body as { status: string; timestamp: string };
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.timestamp).toBe('string');
    });
  });

  describe('/api/ready', () => {
    it('should return ok status when database is available', async () => {
      // Given: A running application with database connection
      // When: Requesting the readiness endpoint
      const response = await request.get('/api/ready').expect(200);

      // Then: Should return ready status
      expect(response.body).toHaveProperty('status', 'ready');
    });
  });
});
