import { INestApplication } from '@nestjs/common';
import {
  createApp,
  createRequest,
  resetDb,
  teardownHarness,
  createTestDocument,
} from './e2e/harness';

describe('Document Access (e2e)', () => {
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

  describe('GET /api/public/:accessCode', () => {
    it('should return document when access code is valid', async () => {
      // Given: A document with a valid access code
      const testData = await createTestDocument(app, {
        accessCode: 'valid-access-code',
      });

      // When: Requesting the document with valid access code
      const response = await request
        .get(`/api/public/${testData.accessCode.code}`)
        .expect(200);

      // Then: Should return the document data
      const body = response.body as { title: string; content: string };
      expect(body.title).toBe(testData.document.title);
      expect(body.content).toBe(testData.document.content);
    });

    it('should return 404 when access code is invalid', async () => {
      // Given: No documents exist
      // When: Requesting with invalid access code
      await request.get('/api/public/invalid-code').expect(404);
    });

    it('should return 410 when access code is expired', async () => {
      // Given: A document with an expired access code
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000);
      const testData = await createTestDocument(app, {
        expiresAt: expiredDate,
      });

      // When: Requesting the document with expired access code
      await request.get(`/api/public/${testData.accessCode.code}`).expect(410);
    });
  });
});
