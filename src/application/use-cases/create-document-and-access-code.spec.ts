import { Document } from '../../domain/entities/document';
import { AccessCode } from '../../domain/entities/access-code';
import { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import { AccessCodeRepositoryPort } from '../../domain/ports/access-code-repository.port';
import { ClockPort } from '../../domain/ports/clock.port';
import { IdGeneratorPort } from '../../domain/ports/id-generator.port';
import { AccessCodeGeneratorPort } from '../../domain/ports/access-code-generator.port';
import { DocumentRepository } from '../../infrastructure/repositories/memory/document';
import { AccessCodeRepository } from '../../infrastructure/repositories/memory/access-code';
import { FakeClock } from '../../infrastructure/testing/fake-clock';
import { FakeIdGenerator } from '../../infrastructure/testing/fake-id-generator';
import { FakeAccessCodeGenerator } from '../../infrastructure/testing/fake-access-code-generator';
import { CreateDocumentAndAccessCodeUseCase } from './create-document-and-access-code';

describe('CreateDocumentAndAccessCodeUseCase', () => {
  let useCase: CreateDocumentAndAccessCodeUseCase;
  let documentRepository: DocumentRepositoryPort;
  let accessCodeRepository: AccessCodeRepositoryPort;
  let clock: ClockPort;
  let idGenerator: IdGeneratorPort;
  let accessCodeGenerator: AccessCodeGeneratorPort;

  beforeEach(() => {
    documentRepository = new DocumentRepository();
    accessCodeRepository = new AccessCodeRepository();
    clock = new FakeClock();
    idGenerator = new FakeIdGenerator();
    accessCodeGenerator = new FakeAccessCodeGenerator();

    useCase = new CreateDocumentAndAccessCodeUseCase(
      documentRepository,
      accessCodeRepository,
      clock,
      idGenerator,
      accessCodeGenerator,
    );
  });

  describe('Happy path', () => {
    it('should create document and access code with no expiration', async () => {
      // Given
      const input = {
        title: 'Test Document',
        content: 'This is test content',
      };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.accessCode).toBe('AC000001');

      // Verify document was persisted
      const documents = await documentRepository.findAll();
      expect(documents).toHaveLength(1);
      expect(documents[0].title).toBe('Test Document');
      expect(documents[0].content).toBe('This is test content');

      // Verify access code was persisted
      const accessCodes = await accessCodeRepository.findAll();
      expect(accessCodes).toHaveLength(1);
      expect(accessCodes[0].code).toBe('AC000001');
      expect(accessCodes[0].documentId).toBe(documents[0].id);
      expect(accessCodes[0].expiresAt).toBeNull();
    });

    it('should create document and access code with expiration', async () => {
      // Given
      const currentTime = new Date('2025-01-01T10:00:00.000Z');
      (clock as FakeClock).setTime(currentTime);

      const input = {
        title: 'Expiring Document',
        content: 'Content that expires',
        expiresIn: 3600, // 1 hour in seconds
      };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.accessCode).toBe('AC000001');

      // Verify access code has correct expiration
      const accessCodes = await accessCodeRepository.findAll();
      expect(accessCodes).toHaveLength(1);
      const expectedExpiration = new Date('2025-01-01T11:00:00.000Z');
      expect(accessCodes[0].expiresAt).toEqual(expectedExpiration);
    });
  });

  describe('Validation', () => {
    it('should throw error for empty title', async () => {
      // Given
      const input = {
        title: '',
        content: 'Valid content',
      };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Title cannot be empty',
      );
    });

    it('should throw error for whitespace-only title', async () => {
      // Given
      const input = {
        title: '   ',
        content: 'Valid content',
      };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Title cannot be empty',
      );
    });

    it('should throw error for empty content', async () => {
      // Given
      const input = {
        title: 'Valid title',
        content: '',
      };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Content cannot be empty',
      );
    });

    it('should throw error for whitespace-only content', async () => {
      // Given
      const input = {
        title: 'Valid title',
        content: '   \n\t  ',
      };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Content cannot be empty',
      );
    });

    it('should throw error for negative expiration time', async () => {
      // Given
      const input = {
        title: 'Valid title',
        content: 'Valid content',
        expiresIn: -3600,
      };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Expiration time must be positive',
      );
    });

    it('should throw error for zero expiration time', async () => {
      // Given
      const input = {
        title: 'Valid title',
        content: 'Valid content',
        expiresIn: 0,
      };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Expiration time must be positive',
      );
    });
  });

  describe('Access code collision handling', () => {
    it('should regenerate access code if collision occurs', async () => {
      // Given - Force generator to return a collision then a unique code
      (accessCodeGenerator as FakeAccessCodeGenerator).forceNextCodes([
        'COLLISION', // This will exist
        'COLLISION', // This will exist (retry)
        'UNIQUE123', // This will be unique
      ]);

      // Create existing access codes that will collide
      const existingDoc = new Document(
        'existing-1',
        'Existing',
        'Content',
        new Date(),
      );
      await documentRepository.save(existingDoc);
      const collisionCode1 = new AccessCode('COLLISION', existingDoc.id, null);
      await accessCodeRepository.save(collisionCode1);

      const input = {
        title: 'New Document',
        content: 'New content',
      };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.accessCode).toBe('UNIQUE123');

      // Verify the new access code was persisted
      const newAccessCode = await accessCodeRepository.findByCode('UNIQUE123');
      expect(newAccessCode).not.toBeNull();

      // Verify we now have 2 access codes total
      const allCodes = await accessCodeRepository.findAll();
      expect(allCodes).toHaveLength(2);
    });

    it('should fail after maximum retry attempts', async () => {
      // Given - Force generator to always return colliding codes
      (accessCodeGenerator as FakeAccessCodeGenerator).forceNextCodes([
        'COLLISION',
        'COLLISION',
        'COLLISION',
        'COLLISION',
        'COLLISION',
        'COLLISION',
        'COLLISION',
        'COLLISION',
        'COLLISION',
        'COLLISION', // 10 collisions
      ]);

      // Create existing access code that will collide
      const existingDoc = new Document(
        'existing-1',
        'Existing',
        'Content',
        new Date(),
      );
      await documentRepository.save(existingDoc);
      const collisionCode = new AccessCode('COLLISION', existingDoc.id, null);
      await accessCodeRepository.save(collisionCode);

      const input = {
        title: 'New Document',
        content: 'New content',
      };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Failed to generate unique access code after maximum attempts',
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle very long expiration times', async () => {
      // Given
      const currentTime = new Date('2025-01-01T10:00:00.000Z');
      (clock as FakeClock).setTime(currentTime);

      const input = {
        title: 'Long Document',
        content: 'Content with long expiration',
        expiresIn: 31536000, // 1 year in seconds
      };

      // When
      const result = await useCase.execute(input);

      // Then
      expect(result.accessCode).toBe('AC000001');

      const accessCodes = await accessCodeRepository.findAll();
      const expectedExpiration = new Date('2026-01-01T10:00:00.000Z');
      expect(accessCodes[0].expiresAt).toEqual(expectedExpiration);
    });

    it('should trim whitespace from title and content', async () => {
      // Given
      const input = {
        title: '  Test Document  ',
        content: '  This is test content  ',
      };

      // When
      await useCase.execute(input);

      // Then
      const documents = await documentRepository.findAll();
      expect(documents[0].title).toBe('Test Document');
      expect(documents[0].content).toBe('This is test content');
    });
  });
});
