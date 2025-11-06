import { Document } from '../../domain/entities/document';
import { AccessCode } from '../../domain/entities/access-code';
import type { DocumentRepository } from '../../domain/entities/repositories/document-repository';
import type { AccessCodeRepository } from '../../domain/entities/repositories/access-code-repository';
import type { Clock } from '../../domain/services/clock';
import type { IdGenerator } from '../../domain/services/id-generator';
import type { AccessCodeGenerator } from '../../domain/services/access-code-generator';

export interface CreateDocumentAndAccessCodeInput {
  title: string;
  content: string;
  expiresIn?: number; // seconds
}

export interface CreateDocumentAndAccessCodeOutput {
  id: string;
  accessCode: string;
}

export class CreateDocumentAndAccessCodeUseCase {
  private static readonly MAX_RETRY_ATTEMPTS = 10;

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly accessCodeRepository: AccessCodeRepository,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
    private readonly accessCodeGenerator: AccessCodeGenerator,
  ) {}

  async execute(
    input: CreateDocumentAndAccessCodeInput,
  ): Promise<CreateDocumentAndAccessCodeOutput> {
    this.validateInput(input);

    const trimmedTitle = input.title.trim();
    const trimmedContent = input.content.trim();

    // Create and persist document
    const documentId = this.idGenerator.generate();
    const createdAt = this.clock.now();
    const document = new Document(
      documentId,
      trimmedTitle,
      trimmedContent,
      createdAt,
    );
    await this.documentRepository.save(document);

    // Generate unique access code
    const accessCode = await this.generateUniqueAccessCode();

    // Calculate expiration if provided
    const expiresAt = input.expiresIn
      ? new Date(createdAt.getTime() + input.expiresIn * 1000)
      : null;

    // Create and persist access code
    const accessCodeEntity = new AccessCode(accessCode, documentId, expiresAt);
    await this.accessCodeRepository.save(accessCodeEntity);

    return {
      id: documentId,
      accessCode,
    };
  }

  private validateInput(input: CreateDocumentAndAccessCodeInput): void {
    if (!input.title || input.title.trim() === '') {
      throw new Error('Title cannot be empty');
    }

    if (!input.content || input.content.trim() === '') {
      throw new Error('Content cannot be empty');
    }

    if (input.expiresIn !== undefined && input.expiresIn <= 0) {
      throw new Error('Expiration time must be positive');
    }
  }

  private async generateUniqueAccessCode(): Promise<string> {
    for (
      let attempt = 0;
      attempt < CreateDocumentAndAccessCodeUseCase.MAX_RETRY_ATTEMPTS;
      attempt++
    ) {
      const code = this.accessCodeGenerator.generate();
      const existing = await this.accessCodeRepository.findByCode(code);

      if (!existing) {
        return code;
      }
    }

    throw new Error(
      'Failed to generate unique access code after maximum attempts',
    );
  }
}
