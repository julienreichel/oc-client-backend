import { Document } from '../entities/document.entity';

export interface DocumentRepositoryPort {
  save(document: Document): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findAll(): Promise<Document[]>;
}
