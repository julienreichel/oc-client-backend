import { Document } from './document.entity';

describe('Document', () => {
  const validId = '123e4567-e89b-12d3-a456-426614174000';
  const validTitle = 'Test Document';
  const validContent = 'This is test content';
  const validDate = new Date('2025-01-01T00:00:00Z');

  describe('construction', () => {
    it('should create a valid document', () => {
      // Given & When
      const document = new Document(
        validId,
        validTitle,
        validContent,
        validDate,
      );

      // Then
      expect(document.id).toBe(validId);
      expect(document.title).toBe(validTitle);
      expect(document.content).toBe(validContent);
      expect(document.createdAt).toBe(validDate);
    });

    it('should create document using static factory method', () => {
      // Given & When
      const document = Document.create(
        validId,
        validTitle,
        validContent,
        validDate,
      );

      // Then
      expect(document).toBeInstanceOf(Document);
      expect(document.id).toBe(validId);
    });
  });

  describe('validation', () => {
    it('should throw error when id is empty', () => {
      // Given & When & Then
      expect(
        () => new Document('', validTitle, validContent, validDate),
      ).toThrow('Document id cannot be empty');
    });

    it('should throw error when id is whitespace only', () => {
      // Given & When & Then
      expect(
        () => new Document('   ', validTitle, validContent, validDate),
      ).toThrow('Document id cannot be empty');
    });

    it('should throw error when title is empty', () => {
      // Given & When & Then
      expect(() => new Document(validId, '', validContent, validDate)).toThrow(
        'Document title cannot be empty',
      );
    });

    it('should throw error when title is whitespace only', () => {
      // Given & When & Then
      expect(
        () => new Document(validId, '   ', validContent, validDate),
      ).toThrow('Document title cannot be empty');
    });

    it('should throw error when content is empty', () => {
      // Given & When & Then
      expect(() => new Document(validId, validTitle, '', validDate)).toThrow(
        'Document content cannot be empty',
      );
    });

    it('should throw error when content is whitespace only', () => {
      // Given & When & Then
      expect(() => new Document(validId, validTitle, '   ', validDate)).toThrow(
        'Document content cannot be empty',
      );
    });

    it('should throw error when createdAt is not a valid date', () => {
      // Given & When & Then
      expect(
        () =>
          new Document(validId, validTitle, validContent, new Date('invalid')),
      ).toThrow('Document createdAt must be a valid date');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      // Given
      const document = new Document(
        validId,
        validTitle,
        validContent,
        validDate,
      );

      // When & Then
      expect(document.id).toBeDefined();
      expect(document.title).toBeDefined();
      expect(document.content).toBeDefined();
      expect(document.createdAt).toBeDefined();
    });
  });
});
