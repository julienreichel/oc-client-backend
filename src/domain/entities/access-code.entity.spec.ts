import { AccessCode } from './access-code.entity';

describe('AccessCode', () => {
  const validCode = 'ABC123XYZ';
  const validDocumentId = '123e4567-e89b-12d3-a456-426614174000';
  const validExpiresAt = new Date('2025-12-31T23:59:59Z');

  describe('construction', () => {
    it('should create a valid access code with expiration', () => {
      // Given & When
      const accessCode = new AccessCode(
        validCode,
        validDocumentId,
        validExpiresAt,
      );

      // Then
      expect(accessCode.code).toBe(validCode);
      expect(accessCode.documentId).toBe(validDocumentId);
      expect(accessCode.expiresAt).toBe(validExpiresAt);
    });

    it('should create a valid access code without expiration', () => {
      // Given & When
      const accessCode = new AccessCode(validCode, validDocumentId, null);

      // Then
      expect(accessCode.code).toBe(validCode);
      expect(accessCode.documentId).toBe(validDocumentId);
      expect(accessCode.expiresAt).toBeNull();
    });

    it('should create access code using static factory method', () => {
      // Given & When
      const accessCode = AccessCode.create(
        validCode,
        validDocumentId,
        validExpiresAt,
      );

      // Then
      expect(accessCode).toBeInstanceOf(AccessCode);
      expect(accessCode.code).toBe(validCode);
    });
  });

  describe('validation', () => {
    it('should throw error when code is empty', () => {
      // Given & When & Then
      expect(() => new AccessCode('', validDocumentId, validExpiresAt)).toThrow(
        'AccessCode code cannot be empty',
      );
    });

    it('should throw error when code is whitespace only', () => {
      // Given & When & Then
      expect(
        () => new AccessCode('   ', validDocumentId, validExpiresAt),
      ).toThrow('AccessCode code cannot be empty');
    });

    it('should throw error when documentId is empty', () => {
      // Given & When & Then
      expect(() => new AccessCode(validCode, '', validExpiresAt)).toThrow(
        'AccessCode documentId cannot be empty',
      );
    });

    it('should throw error when documentId is whitespace only', () => {
      // Given & When & Then
      expect(() => new AccessCode(validCode, '   ', validExpiresAt)).toThrow(
        'AccessCode documentId cannot be empty',
      );
    });

    it('should throw error when expiresAt is an invalid date', () => {
      // Given & When & Then
      expect(
        () => new AccessCode(validCode, validDocumentId, new Date('invalid')),
      ).toThrow('AccessCode expiresAt must be a valid date or null');
    });

    it('should allow null expiresAt', () => {
      // Given & When
      const accessCode = new AccessCode(validCode, validDocumentId, null);

      // Then
      expect(accessCode.expiresAt).toBeNull();
    });
  });

  describe('isExpired', () => {
    it('should return false when expiresAt is null', () => {
      // Given
      const accessCode = new AccessCode(validCode, validDocumentId, null);
      const currentDate = new Date('2025-06-15T12:00:00Z');

      // When
      const result = accessCode.isExpired(currentDate);

      // Then
      expect(result).toBe(false);
    });

    it('should return false when current date is before expiresAt', () => {
      // Given
      const expiresAt = new Date('2025-12-31T23:59:59Z');
      const accessCode = new AccessCode(validCode, validDocumentId, expiresAt);
      const currentDate = new Date('2025-06-15T12:00:00Z');

      // When
      const result = accessCode.isExpired(currentDate);

      // Then
      expect(result).toBe(false);
    });

    it('should return true when current date is after expiresAt', () => {
      // Given
      const expiresAt = new Date('2025-06-15T12:00:00Z');
      const accessCode = new AccessCode(validCode, validDocumentId, expiresAt);
      const currentDate = new Date('2025-12-31T23:59:59Z');

      // When
      const result = accessCode.isExpired(currentDate);

      // Then
      expect(result).toBe(true);
    });

    it('should return false when current date equals expiresAt', () => {
      // Given
      const expiresAt = new Date('2025-06-15T12:00:00Z');
      const accessCode = new AccessCode(validCode, validDocumentId, expiresAt);
      const currentDate = new Date('2025-06-15T12:00:00Z');

      // When
      const result = accessCode.isExpired(currentDate);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      // Given
      const accessCode = new AccessCode(
        validCode,
        validDocumentId,
        validExpiresAt,
      );

      // When & Then
      expect(accessCode.code).toBeDefined();
      expect(accessCode.documentId).toBeDefined();
      expect(accessCode.expiresAt).toBeDefined();
    });
  });
});
