import { Document } from '../../../domain/entities/document';
import { DocumentRepository as DocumentRepositoryInterface } from '../../../domain/entities/repositories/document-repository';

export class DocumentRepository implements DocumentRepositoryInterface {
  private documents: Map<string, Document> = new Map();

  save(document: Document): Promise<Document> {
    this.documents.set(document.id, document);
    return Promise.resolve(document);
  }

  async findById(id: string): Promise<Document | null> {
    return Promise.resolve(this.documents.get(id) || null);
  }

  async findAll(): Promise<Document[]> {
    return Promise.resolve(Array.from(this.documents.values()));
  }

  // Test helper methods
  clear(): void {
    this.documents.clear();
  }

  count(): number {
    return this.documents.size;
  }
}
