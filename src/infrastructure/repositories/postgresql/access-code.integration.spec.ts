import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLAccessCodeRepository } from './access-code';
import { PrismaService } from '../../services/prisma.service';
import { AccessCode } from '../../../domain/entities/access-code';
import { Document } from '../../../domain/entities/document';
import { PostgreSQLDocumentRepository } from './document';

// Skip integration tests if DATABASE_URL is not set
const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

if (!process.env.DATABASE_URL) {
  console.warn(
    '⚠️  Skipping PostgreSQL integration tests: DATABASE_URL not set. Use npm run db:port-forward to connect to cluster DB.',
  );
}

describeIntegration('PostgreSQLAccessCodeRepository (Integration)', () => {
  let repository: PostgreSQLAccessCodeRepository;
  let documentRepository: PostgreSQLDocumentRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgreSQLAccessCodeRepository,
        PostgreSQLDocumentRepository,
        PrismaService,
      ],
    }).compile();

    repository = module.get<PostgreSQLAccessCodeRepository>(
      PostgreSQLAccessCodeRepository,
    );
    documentRepository = module.get<PostgreSQLDocumentRepository>(
      PostgreSQLDocumentRepository,
    );
    prisma = module.get<PrismaService>(PrismaService);

    // Ensure clean state before tests
    await repository.clear();
    await documentRepository.clear();
  });

  afterAll(async () => {
    // Clean up after tests
    await repository.clear();
    await documentRepository.clear();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear data before each test
    await repository.clear();
    await documentRepository.clear();
  });

  describe('save and findByCode', () => {
    it('should save and retrieve an access code with expiration', async () => {
      // Given - Create document first due to foreign key constraint
      const document = new Document(
        'doc-123',
        'Test Document',
        'Test content',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await documentRepository.save(document);

      const accessCode = new AccessCode(
        'TESTCODE123',
        'doc-123',
        new Date('2025-01-01T12:00:00.000Z'),
      );

      // When
      await repository.save(accessCode);
      const found = await repository.findByCode('TESTCODE123');

      // Then
      expect(found).not.toBeNull();
      expect(found!.code).toBe('TESTCODE123');
      expect(found!.documentId).toBe('doc-123');
      expect(found!.expiresAt).toEqual(new Date('2025-01-01T12:00:00.000Z'));
    });

    it('should save and retrieve an access code without expiration', async () => {
      // Given
      const document = new Document(
        'doc-456',
        'Permanent Document',
        'Permanent content',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await documentRepository.save(document);

      const accessCode = new AccessCode('PERMANENT123', 'doc-456', null);

      // When
      await repository.save(accessCode);
      const found = await repository.findByCode('PERMANENT123');

      // Then
      expect(found).not.toBeNull();
      expect(found!.code).toBe('PERMANENT123');
      expect(found!.documentId).toBe('doc-456');
      expect(found!.expiresAt).toBeNull();
    });

    it('should return null for non-existent access code', async () => {
      // When
      const found = await repository.findByCode('NONEXISTENT');

      // Then
      expect(found).toBeNull();
    });

    it('should update existing access code when saving with same code', async () => {
      // Given
      const document = new Document(
        'doc-update',
        'Update Document',
        'Update content',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await documentRepository.save(document);

      const originalAccessCode = new AccessCode(
        'UPDATE123',
        'doc-update',
        new Date('2025-01-01T11:00:00.000Z'),
      );
      await repository.save(originalAccessCode);

      const updatedAccessCode = new AccessCode(
        'UPDATE123',
        'doc-update',
        new Date('2025-01-01T13:00:00.000Z'),
      );

      // When
      await repository.save(updatedAccessCode);
      const found = await repository.findByCode('UPDATE123');

      // Then
      expect(found).not.toBeNull();
      expect(found!.expiresAt).toEqual(new Date('2025-01-01T13:00:00.000Z'));
    });
  });

  describe('findByDocumentId', () => {
    it('should return empty array when no access codes for document', async () => {
      // Given
      const document = new Document(
        'doc-empty',
        'Empty Document',
        'No access codes',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await documentRepository.save(document);

      // When
      const accessCodes = await repository.findByDocumentId('doc-empty');

      // Then
      expect(accessCodes).toEqual([]);
    });

    it('should return access codes for document ordered by expiresAt', async () => {
      // Given
      const document = new Document(
        'doc-multi',
        'Multi Access Document',
        'Multiple access codes',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await documentRepository.save(document);

      const code1 = new AccessCode(
        'CODE1',
        'doc-multi',
        new Date('2025-01-01T15:00:00.000Z'),
      );
      const code2 = new AccessCode(
        'CODE2',
        'doc-multi',
        new Date('2025-01-01T12:00:00.000Z'),
      );
      const code3 = new AccessCode('CODE3', 'doc-multi', null); // No expiration

      await repository.save(code1);
      await repository.save(code2);
      await repository.save(code3);

      // When
      const accessCodes = await repository.findByDocumentId('doc-multi');

      // Then
      expect(accessCodes).toHaveLength(3);
      expect(accessCodes[0].code).toBe('CODE3'); // null expiresAt comes first
      expect(accessCodes[1].code).toBe('CODE2'); // Earlier expiration
      expect(accessCodes[2].code).toBe('CODE1'); // Later expiration
    });
  });

  describe('delete', () => {
    it('should delete existing access code', async () => {
      // Given
      const document = new Document(
        'doc-delete',
        'Delete Document',
        'Delete content',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await documentRepository.save(document);

      const accessCode = new AccessCode(
        'DELETE123',
        'doc-delete',
        new Date('2025-01-01T12:00:00.000Z'),
      );
      await repository.save(accessCode);

      // When
      await repository.delete('DELETE123');
      const found = await repository.findByCode('DELETE123');

      // Then
      expect(found).toBeNull();
    });

    it('should handle deleting non-existent access code gracefully', async () => {
      // When & Then - Should not throw
      await expect(repository.delete('NONEXISTENT')).rejects.toThrow();
    });
  });

  describe('unique constraint on code', () => {
    it('should handle unique constraint violation gracefully', async () => {
      // Given
      const document1 = new Document(
        'doc-1',
        'Document 1',
        'Content 1',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      const document2 = new Document(
        'doc-2',
        'Document 2',
        'Content 2',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await documentRepository.save(document1);
      await documentRepository.save(document2);

      const accessCode1 = new AccessCode(
        'DUPLICATE123',
        'doc-1',
        new Date('2025-01-01T12:00:00.000Z'),
      );
      const accessCode2 = new AccessCode(
        'DUPLICATE123',
        'doc-2',
        new Date('2025-01-01T13:00:00.000Z'),
      );

      await repository.save(accessCode1);

      // When & Then - Second save should update, not create
      await repository.save(accessCode2);
      const found = await repository.findByCode('DUPLICATE123');

      expect(found).not.toBeNull();
      expect(found!.documentId).toBe('doc-2'); // Should be updated to doc-2
      expect(found!.expiresAt).toEqual(new Date('2025-01-01T13:00:00.000Z'));
    });
  });
});
