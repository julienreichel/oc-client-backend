import { INestApplication } from '@nestjs/common';
import {
  createApp,
  createRequest,
  resetDb,
  teardownHarness,
} from './e2e/harness';

describe('Document Creation (e2e)', () => {
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

  describe('POST /api/v1/documents', () => {
    it('should create document with access code', async () => {
      // Given: Valid document data
      const documentData = {
        title: 'New Test Document',
        content: 'Content for the new document.',
      };

      // When: Creating a new document
      const response = await request
        .post('/api/v1/documents')
        .send(documentData)
        .expect(201);

      // Then: Should return created document with access code
      const body = response.body as { id: string; accessCode: string };
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('accessCode');
      expect(typeof body.id).toBe('string');
      expect(typeof body.accessCode).toBe('string');
    });

    it('should validate required fields', async () => {
      // Given: Invalid document data (missing title)
      const invalidData = { content: 'Content without title.' };

      // When: Creating document with invalid data
      const response = await request
        .post('/api/v1/documents')
        .send(invalidData)
        .expect(400);

      // Then: Should return validation error
      const body = response.body as { message: string[] };
      expect(Array.isArray(body.message)).toBe(true);
      expect(body.message.some((msg) => msg.includes('title'))).toBe(true);
    });
  });
});
