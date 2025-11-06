import { DocumentRepository } from '../../domain/entities/repositories/document-repository';
import { AccessCodeRepository } from '../../domain/entities/repositories/access-code-repository';
import { DocumentRepository as MemoryDocumentRepository } from '../repositories/memory/document';
import { AccessCodeRepository as MemoryAccessCodeRepository } from '../repositories/memory/access-code';
import { PostgreSQLDocumentRepository } from '../repositories/postgresql/document';
import { PostgreSQLAccessCodeRepository } from '../repositories/postgresql/access-code';
import { PrismaService } from '../services/prisma.service';

export type RepositoryType = 'memory' | 'postgresql';

export interface TestRepositories {
  documentRepository: DocumentRepository & {
    clear?: () => void | Promise<void>;
  };
  accessCodeRepository: AccessCodeRepository & {
    clear?: () => void | Promise<void>;
  };
  cleanup(): Promise<void>;
}

export class RepositoryFactory {
  static async createRepositories(
    type: RepositoryType = 'memory',
  ): Promise<TestRepositories> {
    switch (type) {
      case 'memory':
        return this.createMemoryRepositories();
      case 'postgresql':
        return this.createPostgreSQLRepositories();
      default:
        throw new Error(`Unsupported repository type: ${String(type)}`);
    }
  }

  private static createMemoryRepositories(): Promise<TestRepositories> {
    const documentRepository = new MemoryDocumentRepository();
    const accessCodeRepository = new MemoryAccessCodeRepository();

    return Promise.resolve({
      documentRepository,
      accessCodeRepository,
      cleanup() {
        documentRepository.clear();
        accessCodeRepository.clear();
        return Promise.resolve();
      },
    });
  }

  private static async createPostgreSQLRepositories(): Promise<TestRepositories> {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();

    const documentRepository = new PostgreSQLDocumentRepository(prismaService);
    const accessCodeRepository = new PostgreSQLAccessCodeRepository(
      prismaService,
    );

    return {
      documentRepository,
      accessCodeRepository,
      async cleanup() {
        await accessCodeRepository.clear();
        await documentRepository.clear();
        await prismaService.$disconnect();
      },
    };
  }
}
