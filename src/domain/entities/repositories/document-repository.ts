import { Document } from '../document';

export interface DocumentRepository {
  save(document: Document): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findAll(): Promise<Document[]>;
}
