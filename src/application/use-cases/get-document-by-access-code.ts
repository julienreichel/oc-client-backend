import { DocumentRepository } from '../../domain/entities/repositories/document-repository';
import { AccessCodeRepository } from '../../domain/entities/repositories/access-code-repository';
import { Clock } from '../../domain/services/clock';

export interface GetDocumentByAccessCodeInput {
  code: string;
}

export interface GetDocumentByAccessCodeOutput {
  title: string;
  content: string;
  createdAt: Date;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AccessCodeExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessCodeExpiredError';
  }
}

export class GetDocumentByAccessCodeUseCase {
  constructor(
    private readonly accessCodeRepository: AccessCodeRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: GetDocumentByAccessCodeInput,
  ): Promise<GetDocumentByAccessCodeOutput> {
    this.validateInput(input);

    const trimmedCode = input.code.trim();

    // Find access code
    const accessCode = await this.accessCodeRepository.findByCode(trimmedCode);
    if (!accessCode) {
      throw new NotFoundError('Access code not found');
    }

    // Check if access code is expired
    const currentTime = this.clock.now();
    if (accessCode.isExpired(currentTime)) {
      throw new AccessCodeExpiredError('Access code has expired');
    }

    // Find linked document
    const document = await this.documentRepository.findById(
      accessCode.documentId,
    );
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Return read-only DTO
    return {
      title: document.title,
      content: document.content,
      createdAt: document.createdAt,
    };
  }

  private validateInput(input: GetDocumentByAccessCodeInput): void {
    if (!input.code || input.code.trim() === '') {
      throw new Error('Access code is required');
    }
  }
}
