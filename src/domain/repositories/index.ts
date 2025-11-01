import { DocumentEntity } from '../entities/document.entity';
import { AccessCodeEntity } from '../entities/access-code.entity';

export interface DocumentRepository {
  save(document: DocumentEntity): Promise<DocumentEntity>;
  findById(id: string): Promise<DocumentEntity | null>;
  findByAccessCode(accessCode: string): Promise<DocumentEntity | null>;
  delete(id: string): Promise<void>;
}

export interface AccessCodeRepository {
  save(accessCode: AccessCodeEntity): Promise<AccessCodeEntity>;
  findByCode(code: string): Promise<AccessCodeEntity | null>;
  findByDocumentId(documentId: string): Promise<AccessCodeEntity[]>;
  delete(code: string): Promise<void>;
}
