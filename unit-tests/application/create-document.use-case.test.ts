import { CreateDocumentUseCase } from '../../src/application/use-cases/create-document.use-case';
import {
  DocumentRepository,
  AccessCodeRepository,
} from '../../src/domain/repositories';
import { DocumentEntity } from '../../src/domain/entities/document.entity';
import { AccessCodeEntity } from '../../src/domain/entities/access-code.entity';

describe('CreateDocumentUseCase', () => {
  let useCase: CreateDocumentUseCase;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;
  let mockAccessCodeRepository: jest.Mocked<AccessCodeRepository>;

  beforeEach(() => {
    mockDocumentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByAccessCode: jest.fn(),
      delete: jest.fn(),
    };

    mockAccessCodeRepository = {
      save: jest.fn(),
      findByCode: jest.fn(),
      findByDocumentId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new CreateDocumentUseCase(
      mockDocumentRepository,
      mockAccessCodeRepository,
    );
  });

  describe('when creating a document', () => {
    const documentParams = {
      title: 'Test Document',
      content: 'Test content',
    };

    describe('with valid parameters', () => {
      it('should create and save a document', async () => {
        // Given
        const mockDocument = DocumentEntity.create(documentParams);
        const mockAccessCode = AccessCodeEntity.create(mockDocument.id);

        mockDocumentRepository.save.mockResolvedValue(mockDocument);
        mockAccessCodeRepository.save.mockResolvedValue(mockAccessCode);

        // When
        const result = await useCase.execute(documentParams);

        // Then
        expect(mockDocumentRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            title: documentParams.title,
            content: documentParams.content,
          }),
        );
        expect(mockAccessCodeRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            documentId: expect.any(String),
          }),
        );
        expect(result.document).toEqual(mockDocument);
        expect(result.accessCode).toBeDefined();
      });
    });

    describe('with expiration date', () => {
      it('should create document and access code with expiration', async () => {
        // Given
        const expiresAt = new Date(Date.now() + 86400000); // 24 hours
        const paramsWithExpiry = { ...documentParams, expiresAt };
        const savedDocument = DocumentEntity.create(paramsWithExpiry);
        const savedAccessCode = AccessCodeEntity.create(
          savedDocument.id,
          expiresAt,
        );

        mockDocumentRepository.save.mockResolvedValue(savedDocument);
        mockAccessCodeRepository.save.mockResolvedValue(savedAccessCode);

        // When
        const result = await useCase.execute(paramsWithExpiry);

        // Then
        expect(result.document.expiresAt).toEqual(expiresAt);
      });
    });
  });
});
