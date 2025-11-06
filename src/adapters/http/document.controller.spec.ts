import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DocumentController } from './document.controller';
import { CreateDocumentAndAccessCodeUseCase } from '../../application/use-cases/create-document-and-access-code';
import { DocumentRepository as DocumentRepositoryImpl } from '../../infrastructure/repositories/memory/document';
import { AccessCodeRepository as AccessCodeRepositoryImpl } from '../../infrastructure/repositories/memory/access-code';
import { FakeClock } from '../../infrastructure/testing/fake-clock';
import { FakeIdGenerator } from '../../infrastructure/testing/fake-id-generator';
import { FakeAccessCodeGenerator } from '../../infrastructure/testing/fake-access-code-generator';

describe('DocumentController', () => {
  let app: INestApplication;
  let documentRepository: DocumentRepositoryImpl;
  let accessCodeRepository: AccessCodeRepositoryImpl;
  let fakeClock: FakeClock;
  let fakeIdGenerator: FakeIdGenerator;
  let fakeAccessCodeGenerator: FakeAccessCodeGenerator;

  beforeEach(async () => {
    // Create fresh instances for each test
    documentRepository = new DocumentRepositoryImpl();
    accessCodeRepository = new AccessCodeRepositoryImpl();
    fakeClock = new FakeClock();
    fakeIdGenerator = new FakeIdGenerator();
    fakeAccessCodeGenerator = new FakeAccessCodeGenerator();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: CreateDocumentAndAccessCodeUseCase,
          useFactory: () =>
            new CreateDocumentAndAccessCodeUseCase(
              documentRepository,
              accessCodeRepository,
              fakeClock,
              fakeIdGenerator,
              fakeAccessCodeGenerator,
            ),
        },
        // Provide the interfaces (not used directly, but needed for DI)
        { provide: 'DocumentRepository', useValue: documentRepository },
        { provide: 'AccessCodeRepository', useValue: accessCodeRepository },
        { provide: 'Clock', useValue: fakeClock },
        { provide: 'IdGenerator', useValue: fakeIdGenerator },
        { provide: 'AccessCodeGenerator', useValue: fakeAccessCodeGenerator },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Reset test utilities
    documentRepository.clear();
    accessCodeRepository.clear();
    fakeIdGenerator.reset();
    fakeAccessCodeGenerator.reset();
    fakeClock.setTime(new Date('2025-01-01T10:00:00.000Z'));
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/documents', () => {
    it('should create document and return access code for valid payload', async () => {
      // Given
      const validPayload = {
        title: 'Test Document',
        content: 'This is test content',
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/v1/documents')
        .send(validPayload)
        .expect(201);

      // Then
      expect(response.body).toEqual({
        id: 'test-id-001',
        accessCode: 'AC000001',
      });

      // Verify document was persisted
      const documents = await documentRepository.findAll();
      expect(documents).toHaveLength(1);
      expect(documents[0].title).toBe('Test Document');
      expect(documents[0].content).toBe('This is test content');
    });

    it('should create document with expiration and return access code', async () => {
      // Given
      const validPayload = {
        title: 'Expiring Document',
        content: 'Content with expiration',
        expiresIn: 3600, // 1 hour
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/v1/documents')
        .send(validPayload)
        .expect(201);

      // Then
      expect(response.body).toEqual({
        id: 'test-id-001',
        accessCode: 'AC000001',
      });

      // Verify access code has correct expiration
      const accessCodes = await accessCodeRepository.findAll();
      expect(accessCodes).toHaveLength(1);
      const expectedExpiration = new Date('2025-01-01T11:00:00.000Z');
      expect(accessCodes[0].expiresAt).toEqual(expectedExpiration);
    });

    describe('Validation errors (400)', () => {
      it('should return 400 for missing title', async () => {
        // Given
        const invalidPayload = {
          content: 'Content without title',
        };

        // When
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .send(invalidPayload)
          .expect(400);

        // Then
        expect(response.body.message).toContain('title should not be empty');
      });

      it('should return 400 for empty title', async () => {
        // Given
        const invalidPayload = {
          title: '',
          content: 'Valid content',
        };

        // When
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .send(invalidPayload)
          .expect(400);

        // Then
        expect(response.body.message).toContain('title should not be empty');
      });

      it('should return 400 for missing content', async () => {
        // Given
        const invalidPayload = {
          title: 'Valid title',
        };

        // When
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .send(invalidPayload)
          .expect(400);

        // Then
        expect(response.body.message).toContain('content should not be empty');
      });

      it('should return 400 for empty content', async () => {
        // Given
        const invalidPayload = {
          title: 'Valid title',
          content: '',
        };

        // When
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .send(invalidPayload)
          .expect(400);

        // Then
        expect(response.body.message).toContain('content should not be empty');
      });

      it('should return 400 for invalid expiresIn (negative)', async () => {
        // Given
        const invalidPayload = {
          title: 'Valid title',
          content: 'Valid content',
          expiresIn: -3600,
        };

        // When
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .send(invalidPayload)
          .expect(400);

        // Then
        expect(response.body.message).toContain(
          'expiresIn must be a positive number',
        );
      });

      it('should return 400 for invalid expiresIn (zero)', async () => {
        // Given
        const invalidPayload = {
          title: 'Valid title',
          content: 'Valid content',
          expiresIn: 0,
        };

        // When
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .send(invalidPayload)
          .expect(400);

        // Then
        expect(response.body.message).toContain(
          'expiresIn must be a positive number',
        );
      });

      it('should return 400 for invalid expiresIn (non-integer)', async () => {
        // Given
        const invalidPayload = {
          title: 'Valid title',
          content: 'Valid content',
          expiresIn: 3.14,
        };

        // When
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .send(invalidPayload)
          .expect(400);

        // Then
        expect(response.body.message).toContain(
          'expiresIn must be an integer number',
        );
      });
    });
  });
});
