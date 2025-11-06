import { Document } from '../../domain/entities/document';
import { AccessCode } from '../../domain/entities/access-code';
import { DocumentRepository } from '../../domain/entities/repositories/document-repository';
import { AccessCodeRepository } from '../../domain/entities/repositories/access-code-repository';
import { Clock } from '../../domain/services/clock';
import { DocumentRepository as DocumentRepositoryImpl } from '../../infrastructure/repositories/memory/document';
import { AccessCodeRepository as AccessCodeRepositoryImpl } from '../../infrastructure/repositories/memory/access-code';
import { FakeClock } from '../../infrastructure/testing/fake-clock';
import { GetDocumentByAccessCodeUseCase } from './get-document-by-access-code';

describe('GetDocumentByAccessCodeUseCase', () => {
  let useCase: GetDocumentByAccessCodeUseCase;
  let documentRepository: DocumentRepository;
  let accessCodeRepository: AccessCodeRepository;
  let clock: Clock;

  beforeEach(() => {
    documentRepository = new DocumentRepositoryImpl();
    accessCodeRepository = new AccessCodeRepositoryImpl();
    clock = new FakeClock();

    useCase = new GetDocumentByAccessCodeUseCase(
      accessCodeRepository,
      documentRepository,
      clock,
    );
  });

  describe('Valid access code', () => {
    it('should return document DTO for valid non-expired access code', async () => {
      // Given
      const currentTime = new Date('2025-01-01T10:00:00.000Z');
      (clock as FakeClock).setTime(currentTime);

      const document = new Document(
        'doc-123',
        'Test Document',
        'This is test content',
        new Date('2025-01-01T09:00:00.000Z'),
      );
      await documentRepository.save(document);

      const accessCode = new AccessCode(
        'AC123456',
        'doc-123',
        new Date('2025-01-01T11:00:00.000Z'), // Expires in 1 hour
      );
      await accessCodeRepository.save(accessCode);

      // When
      const result = await useCase.execute({ code: 'AC123456' });

      // Then
      expect(result).toEqual({
        title: 'Test Document',
        content: 'This is test content',
        createdAt: new Date('2025-01-01T09:00:00.000Z'),
      });
    });

    it('should return document DTO for access code with no expiration', async () => {
      // Given
      const currentTime = new Date('2025-01-01T10:00:00.000Z');
      (clock as FakeClock).setTime(currentTime);

      const document = new Document(
        'doc-456',
        'Permanent Document',
        'Content that never expires',
        new Date('2025-01-01T08:00:00.000Z'),
      );
      await documentRepository.save(document);

      const accessCode = new AccessCode('PERMANENT', 'doc-456', null); // No expiration
      await accessCodeRepository.save(accessCode);

      // When
      const result = await useCase.execute({ code: 'PERMANENT' });

      // Then
      expect(result).toEqual({
        title: 'Permanent Document',
        content: 'Content that never expires',
        createdAt: new Date('2025-01-01T08:00:00.000Z'),
      });
    });
  });

  describe('Missing/unknown code', () => {
    it('should throw NotFoundError for unknown access code', async () => {
      // Given
      const input = { code: 'UNKNOWN123' };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Access code not found',
      );
    });

    it('should throw error for empty code', async () => {
      // Given
      const input = { code: '' };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Access code is required',
      );
    });
  });

  describe('Expired access code', () => {
    it('should throw AccessCodeExpiredError for expired access code', async () => {
      // Given
      const currentTime = new Date('2025-01-01T12:00:00.000Z');
      (clock as FakeClock).setTime(currentTime);

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

      // When & Then
      await expect(useCase.execute({ code: 'EXPIRED123' })).rejects.toThrow(
        'Access code has expired',
      );
    });

    it('should allow access for code that expires exactly now', async () => {
      // Given
      const currentTime = new Date('2025-01-01T11:00:00.000Z');
      (clock as FakeClock).setTime(currentTime);

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
      const result = await useCase.execute({ code: 'EXACTTIME' });

      // Then
      expect(result).toEqual({
        title: 'Exact Expiry Document',
        content: 'Content expiring now',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
      });
    });

    it('should throw AccessCodeExpiredError for code expired one second ago', async () => {
      // Given
      const currentTime = new Date('2025-01-01T11:00:01.000Z'); // One second after expiration
      (clock as FakeClock).setTime(currentTime);

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

      // When & Then
      await expect(useCase.execute({ code: 'JUSTEXPIRED' })).rejects.toThrow(
        'Access code has expired',
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle document not found (orphaned access code)', async () => {
      // Given
      const currentTime = new Date('2025-01-01T10:00:00.000Z');
      (clock as FakeClock).setTime(currentTime);

      // Access code exists but document was deleted (orphaned)
      const accessCode = new AccessCode(
        'ORPHANED123',
        'nonexistent-doc',
        new Date('2025-01-01T11:00:00.000Z'),
      );
      await accessCodeRepository.save(accessCode);

      // When & Then
      await expect(useCase.execute({ code: 'ORPHANED123' })).rejects.toThrow(
        'Document not found',
      );
    });

    it('should validate input code is provided', async () => {
      // Given - no code provided (should be handled by validation)
      const input = { code: undefined as any };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Access code is required',
      );
    });

    it('should handle whitespace-only code', async () => {
      // Given
      const input = { code: '   ' };

      // When & Then
      await expect(useCase.execute(input)).rejects.toThrow(
        'Access code is required',
      );
    });
  });

  describe('Time precision', () => {
    it('should handle access code expiring one second in the future', async () => {
      // Given
      const currentTime = new Date('2025-01-01T10:59:59.000Z');
      (clock as FakeClock).setTime(currentTime);

      const document = new Document(
        'doc-future',
        'Future Document',
        'Still valid content',
        new Date('2025-01-01T10:00:00.000Z'),
      );
      await documentRepository.save(document);

      const accessCode = new AccessCode(
        'FUTURE123',
        'doc-future',
        new Date('2025-01-01T11:00:00.000Z'), // Expires 1 second in future
      );
      await accessCodeRepository.save(accessCode);

      // When
      const result = await useCase.execute({ code: 'FUTURE123' });

      // Then
      expect(result).toEqual({
        title: 'Future Document',
        content: 'Still valid content',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
      });
    });
  });
});
