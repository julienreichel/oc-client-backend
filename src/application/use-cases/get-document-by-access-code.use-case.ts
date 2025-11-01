import { DocumentEntity } from '../../domain/entities/document.entity';
import {
  DocumentRepository,
  AccessCodeRepository,
} from '../../domain/repositories';

export class GetDocumentByAccessCodeUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly accessCodeRepository: AccessCodeRepository,
  ) {}

  async execute(accessCode: string): Promise<DocumentEntity | null> {
    const accessCodeEntity =
      await this.accessCodeRepository.findByCode(accessCode);

    if (!accessCodeEntity || accessCodeEntity.isExpired()) {
      return null;
    }

    const document = await this.documentRepository.findById(
      accessCodeEntity.documentId,
    );

    if (!document || document.isExpired()) {
      return null;
    }

    return document;
  }
}
