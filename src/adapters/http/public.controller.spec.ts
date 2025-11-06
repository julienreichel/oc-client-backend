import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PublicController } from './public.controller';
import { GetDocumentByAccessCodeUseCase } from '../../application/use-cases/get-document-by-access-code';
import { Document } from '../../domain/entities/document';
import { AccessCode } from '../../domain/entities/access-code';
import { DocumentRepository as DocumentRepositoryImpl } from '../../infrastructure/repositories/memory/document';
import { AccessCodeRepository as AccessCodeRepositoryImpl } from '../../infrastructure/repositories/memory/access-code';
import { FakeClock } from '../../infrastructure/testing/fake-clock';
import { DomainExceptionFilter } from './filters/domain-exception.filter';

describe('PublicController', () => {
  let app: INestApplication;
  let documentRepository: DocumentRepositoryImpl;
  let accessCodeRepository: AccessCodeRepositoryImpl;
  let fakeClock: FakeClock;

  beforeEach(async () => {
    // Create fresh instances for each test
    documentRepository = new DocumentRepositoryImpl();
    accessCodeRepository = new AccessCodeRepositoryImpl();
    fakeClock = new FakeClock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [
        {
          provide: GetDocumentByAccessCodeUseCase,
          useFactory: () =>
            new GetDocumentByAccessCodeUseCase(
              accessCodeRepository,
              documentRepository,
              fakeClock,
            ),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    // Reset test utilities
    documentRepository.clear();
    accessCodeRepository.clear();
    fakeClock.setTime(new Date('2025-01-01T10:00:00.000Z'));
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/public/:accessCode', () => {
    it('should return document for valid non-expired access code', async () => {
      // Given
      const document = new Document(
        'doc-123',
        'Test Document',
        'This is test content',
        new Date('2025-01-01T09:00:00.000Z'),
      );
      await documentRepository.save(document);

      const accessCode = new AccessCode(
        'VALID123',
        'doc-123',
        new Date('2025-01-01T11:00:00.000Z'), // Expires in 1 hour
      );
      await accessCodeRepository.save(accessCode);

      // When
      const response = await request(app.getHttpServer())
        .get('/api/public/VALID123')
        .expect(200);

      // Then
      expect(response.body).toEqual({
        title: 'Test Document',
        content: 'This is test content',
        createdAt: '2025-01-01T09:00:00.000Z',
      });
    });

    it('should return document for access code with no expiration', async () => {
      // Given
      const document = new Document(
        'doc-456',
        'Permanent Document',
        'Content that never expires',
        new Date('2025-01-01T08:00:00.000Z'),
      );
      await documentRepository.save(document);

      const accessCode = new AccessCode('PERMANENT', 'doc-456', null);
      await accessCodeRepository.save(accessCode);

      // When
      const response = await request(app.getHttpServer())
        .get('/api/public/PERMANENT')
        .expect(200);

      // Then
      expect(response.body).toEqual({
        title: 'Permanent Document',
        content: 'Content that never expires',
        createdAt: '2025-01-01T08:00:00.000Z',
      });
    });

    describe('404 Not Found cases', () => {
      it('should return 404 for unknown access code', async () => {
        // When
        const response = await request(app.getHttpServer())
          .get('/api/public/UNKNOWN123')
          .expect(404);

        // Then
        expect(response.body).toMatchObject({
          statusCode: 404,
          error: 'NOT_FOUND',
          message: 'Access code not found',
        });
        expect(response.body.timestamp).toBeDefined();
      });

      it('should return 404 for expired access code', async () => {
        // Given
        fakeClock.setTime(new Date('2025-01-01T12:00:00.000Z')); // 1 hour later

        const document = new Document(
          'doc-789',
          'Expired Document',
          'This content has expired',
          new Date('2025-01-01T09:00:00.000Z'),
        );
        await documentRepository.save(document);

        const accessCode = new AccessCode(
          'EXPIRED123',
          'doc-789',
          new Date('2025-01-01T11:00:00.000Z'), // Expired 1 hour ago
        );
        await accessCodeRepository.save(accessCode);

        // When
        const response = await request(app.getHttpServer())
          .get('/api/public/EXPIRED123')
          .expect(410);

        // Then
        expect(response.body).toMatchObject({
          statusCode: 410,
          error: 'ACCESS_CODE_EXPIRED',
          message: 'Access code has expired',
        });
        expect(response.body.timestamp).toBeDefined();
      });

      it('should return 404 for orphaned access code (document deleted)', async () => {
        // Given
        const accessCode = new AccessCode(
          'ORPHANED123',
          'nonexistent-doc',
          new Date('2025-01-01T11:00:00.000Z'),
        );
        await accessCodeRepository.save(accessCode);

        // When
        const response = await request(app.getHttpServer())
          .get('/api/public/ORPHANED123')
          .expect(404);

        // Then
        expect(response.body).toMatchObject({
          statusCode: 404,
          error: 'NOT_FOUND',
          message: 'Document not found',
        });
        expect(response.body.timestamp).toBeDefined();
      });
    });

    describe('Edge cases', () => {
      it('should handle access code that expires exactly now', async () => {
        // Given
        fakeClock.setTime(new Date('2025-01-01T11:00:00.000Z'));

        const document = new Document(
          'doc-exact',
          'Exact Expiry Document',
          'Content expiring now',
          new Date('2025-01-01T10:00:00.000Z'),
        );
        await documentRepository.save(document);

        const accessCode = new AccessCode(
          'EXACTTIME',
          'doc-exact',
          new Date('2025-01-01T11:00:00.000Z'), // Expires exactly now (still valid)
        );
        await accessCodeRepository.save(accessCode);

        // When
        const response = await request(app.getHttpServer())
          .get('/api/public/EXACTTIME')
          .expect(200);

        // Then
        expect(response.body).toEqual({
          title: 'Exact Expiry Document',
          content: 'Content expiring now',
          createdAt: '2025-01-01T10:00:00.000Z',
        });
      });

      it('should handle access code expired one second ago', async () => {
        // Given
        fakeClock.setTime(new Date('2025-01-01T11:00:01.000Z'));

        const document = new Document(
          'doc-past',
          'Past Document',
          'Content that just expired',
          new Date('2025-01-01T10:00:00.000Z'),
        );
        await documentRepository.save(document);

        const accessCode = new AccessCode(
          'JUSTEXPIRED',
          'doc-past',
          new Date('2025-01-01T11:00:00.000Z'), // Expired one second ago
        );
        await accessCodeRepository.save(accessCode);

        // When
        const response = await request(app.getHttpServer())
          .get('/api/public/JUSTEXPIRED')
          .expect(410);

        // Then
        expect(response.body).toMatchObject({
          statusCode: 410,
          error: 'ACCESS_CODE_EXPIRED',
          message: 'Access code has expired',
        });
      });
    });
  });
});
