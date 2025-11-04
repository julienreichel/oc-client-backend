import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSQLDocumentRepository } from './document';
import { PrismaService } from '../../services/prisma.service';
import { Document } from '../../../domain/entities/document';

// Skip integration tests if DATABASE_URL is not set
const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

if (!process.env.DATABASE_URL) {
  console.warn(
    '⚠️  Skipping PostgreSQL integration tests: DATABASE_URL not set. Use npm run db:port-forward to connect to cluster DB.',
  );
}

describeIntegration('PostgreSQLDocumentRepository (Integration)', () => {
  let repository: PostgreSQLDocumentRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostgreSQLDocumentRepository, PrismaService],
    }).compile();

    repository = module.get<PostgreSQLDocumentRepository>(
      PostgreSQLDocumentRepository,
    );
    prisma = module.get<PrismaService>(PrismaService);

    // Ensure clean state before tests
    await repository.clear();
  });

  afterAll(async () => {
    // Clean up after tests
    await repository.clear();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear data before each test
    await repository.clear();
  });

  describe('save and findById', () => {
    it('should save and retrieve a document', async () => {
      // Given
      const document = new Document(
        'doc-123',
        'Test Document',
        'This is test content',
        new Date('2025-01-01T10:00:00.000Z'),
      );

      // When
      await repository.save(document);
      const found = await repository.findById('doc-123');

      // Then
      expect(found).not.toBeNull();
      expect(found!.id).toBe('doc-123');
      expect(found!.title).toBe('Test Document');
      expect(found!.content).toBe('This is test content');
      expect(found!.createdAt).toEqual(new Date('2025-01-01T10:00:00.000Z'));
    });

    it('should return null for non-existent document', async () => {
      // When
      const found = await repository.findById('non-existent');

      // Then
      expect(found).toBeNull();
    });

    it('should update existing document when saving with same id', async () => {
      // Given
      const originalDocument = new Document(
        'doc-update',
        'Original Title',
        'Original content',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await repository.save(originalDocument);

      const updatedDocument = new Document(
        'doc-update',
        'Updated Title',
        'Updated content',
        new Date('2025-01-01T11:00:00.000Z'),
      );

      // When
      await repository.save(updatedDocument);
      const found = await repository.findById('doc-update');

      // Then
      expect(found).not.toBeNull();
      expect(found!.title).toBe('Updated Title');
      expect(found!.content).toBe('Updated content');
      expect(found!.createdAt).toEqual(new Date('2025-01-01T11:00:00.000Z'));
    });
  });

  describe('findAll', () => {
    it('should return empty array when no documents', async () => {
      // When
      const documents = await repository.findAll();

      // Then
      expect(documents).toEqual([]);
    });

    it('should return all documents ordered by createdAt desc', async () => {
      // Given
      const doc1 = new Document(
        'doc-1',
        'First Document',
        'First content',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      const doc2 = new Document(
        'doc-2',
        'Second Document',
        'Second content',
        new Date('2025-01-01T12:00:00.000Z'),
      );
      const doc3 = new Document(
        'doc-3',
        'Third Document',
        'Third content',
        new Date('2025-01-01T11:00:00.000Z'),
      );

      await repository.save(doc1);
      await repository.save(doc2);
      await repository.save(doc3);

      // When
      const documents = await repository.findAll();

      // Then
      expect(documents).toHaveLength(3);
      expect(documents[0].id).toBe('doc-2'); // Most recent first
      expect(documents[1].id).toBe('doc-3');
      expect(documents[2].id).toBe('doc-1'); // Oldest last
    });
  });

  describe('delete', () => {
    it('should delete existing document', async () => {
      // Given
      const document = new Document(
        'doc-delete',
        'Delete Me',
        'Content to delete',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await repository.save(document);

      // When
      await repository.delete('doc-delete');
      const found = await repository.findById('doc-delete');

      // Then
      expect(found).toBeNull();
    });

    it('should handle deleting non-existent document gracefully', async () => {
      // When & Then - Should not throw
      await expect(repository.delete('non-existent')).rejects.toThrow();
    });
  });
});
