import { Document } from '../../domain/entities/document.entity';
import { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';

export class InMemoryDocumentRepository implements DocumentRepositoryPort {
  private documents: Map<string, Document> = new Map();

  save(document: Document): Promise<Document> {
    this.documents.set(document.id, document);
    return Promise.resolve(document);
  }

  findById(id: string): Promise<Document | null> {
    return Promise.resolve(this.documents.get(id) || null);
  }

  // Test helper methods
  clear(): void {
    this.documents.clear();
  }

  count(): number {
    return this.documents.size;
  }
}
