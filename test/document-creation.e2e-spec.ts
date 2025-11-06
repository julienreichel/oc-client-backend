import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/infrastructure/services/prisma.service';
import {
  createApp,
  createRequest,
  resetDb,
  teardownHarness,
} from './e2e/harness';

describe('E2E-2: Document Ingest (POST /api/v1/documents)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof createRequest>;
  let prismaService: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    request = createRequest(app);
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await resetDb(app);
  });

  afterAll(async () => {
    await app?.close();
    await teardownHarness();
  });

  it('should return 201 with accessCode for valid payload', async () => {
    // Given: Valid document data from provider backend
    const documentData = {
      title: 'Provider Document',
      content: 'Document from provider backend.',
    };

    // When: Provider posts document for ingest
    const response = await request
      .post('/api/v1/documents')
      .send(documentData)
      .expect(201);

    // Then: Should return proper format
    const body = response.body as { id: string; accessCode: string };
    expect(Object.keys(body)).toEqual(['id', 'accessCode']);
    expect(typeof body.accessCode).toBe('string');
    expect(body.accessCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(body.accessCode.length).toBe(8);
  });

  it('should persist document and access code in database', async () => {
    // Given: Valid document data
    const documentData = { title: 'Test Doc', content: 'Test content.' };

    // When: Creating document
    const response = await request
      .post('/api/v1/documents')
      .send(documentData)
      .expect(201);

    // Then: Should persist correctly
    const { id, accessCode } = response.body as {
      id: string;
      accessCode: string;
    };

    const documents = await prismaService.document.findMany();
    const accessCodes = await prismaService.accessCode.findMany();

    expect(documents).toHaveLength(1);
    expect(accessCodes).toHaveLength(1);
    expect(documents[0].id).toBe(id);
    expect(documents[0].title).toBe(documentData.title);
    expect(accessCodes[0].code).toBe(accessCode);
    expect(accessCodes[0].documentId).toBe(id);
  });

  it('should return 400 for empty title', async () => {
    // Given: Invalid data with empty title
    const invalidData = { title: '', content: 'Valid content.' };

    // When: Attempting to create document
    const response = await request
      .post('/api/v1/documents')
      .send(invalidData)
      .expect(400);

    // Then: Should return validation error
    const body = response.body as { message: string[] };
    expect(Array.isArray(body.message)).toBe(true);
    expect(body.message.some((msg) => msg.includes('title'))).toBe(true);

    // Verify no persistence
    const documents = await prismaService.document.findMany();
    expect(documents).toHaveLength(0);
  });

  it('should return 400 for empty content', async () => {
    // Given: Invalid data with empty content
    const invalidData = { title: 'Valid Title', content: '' };

    // When: Attempting to create document
    const response = await request
      .post('/api/v1/documents')
      .send(invalidData)
      .expect(400);

    // Then: Should return validation error
    const body = response.body as { message: string[] };
    expect(body.message.some((msg) => msg.includes('content'))).toBe(true);

    const documents = await prismaService.document.findMany();
    expect(documents).toHaveLength(0);
  });

  it('should create distinct codes for identical payloads', async () => {
    // Given: Same payload posted twice
    const documentData = { title: 'Duplicate', content: 'Same content.' };

    // When: Posting same data twice
    const response1 = await request
      .post('/api/v1/documents')
      .send(documentData)
      .expect(201);

    const response2 = await request
      .post('/api/v1/documents')
      .send(documentData)
      .expect(201);

    // Then: Should create distinct documents
    const body1 = response1.body as { id: string; accessCode: string };
    const body2 = response2.body as { id: string; accessCode: string };

    expect(body1.id).not.toBe(body2.id);
    expect(body1.accessCode).not.toBe(body2.accessCode);

    const documents = await prismaService.document.findMany();
    expect(documents).toHaveLength(2);
  });

  it('should return only id and accessCode fields', async () => {
    // Given: Valid document data
    const documentData = { title: 'Format Test', content: 'Test content.' };

    // When: Creating document
    const response = await request
      .post('/api/v1/documents')
      .send(documentData)
      .expect(201);

    // Then: Response should have exact fields with no leakage
    const body = response.body as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['accessCode', 'id']);
    expect(body).not.toHaveProperty('title');
    expect(body).not.toHaveProperty('content');
    expect(body).not.toHaveProperty('createdAt');
  });
});
