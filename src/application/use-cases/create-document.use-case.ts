import { DocumentEntity } from '../../domain/entities/document.entity';
import { AccessCodeEntity } from '../../domain/entities/access-code.entity';
import {
  DocumentRepository,
  AccessCodeRepository,
} from '../../domain/repositories';

export class CreateDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly accessCodeRepository: AccessCodeRepository,
  ) {}

  async execute(params: {
    title: string;
    content: string;
    expiresAt?: Date;
  }): Promise<{ document: DocumentEntity; accessCode: string }> {
    const document = DocumentEntity.create(params);
    const savedDocument = await this.documentRepository.save(document);

    const accessCode = AccessCodeEntity.create(document.id, params.expiresAt);
    await this.accessCodeRepository.save(accessCode);

    return {
      document: savedDocument,
      accessCode: accessCode.code,
    };
  }
}
