import { Document } from '../../domain/entities/document';
import { AccessCode } from '../../domain/entities/access-code';
import {
  RepositoryFactory,
  RepositoryType,
  TestRepositories,
} from './repository-factory';

describe('Repository Factory (Switching)', () => {
  // Only test PostgreSQL if DATABASE_URL is available
  const repositoryTypes: RepositoryType[] = ['memory'];

  if (process.env.DATABASE_URL) {
    repositoryTypes.push('postgresql');
  } else {
    console.warn(
      '⚠️  Skipping PostgreSQL repository tests: DATABASE_URL not set. Use npm run db:port-forward to connect to cluster DB.',
    );
  }

  repositoryTypes.forEach((repositoryType) => {
    describe(`Using ${repositoryType} repositories`, () => {
      let repositories: TestRepositories;

      beforeAll(async () => {
        repositories =
          await RepositoryFactory.createRepositories(repositoryType);
      });

      afterAll(async () => {
        if (repositories) {
          await repositories.cleanup();
        }
      });

      beforeEach(async () => {
        // Clear repositories before each test
        if (repositories.documentRepository.clear) {
          await repositories.documentRepository.clear();
        }
        if (repositories.accessCodeRepository.clear) {
          await repositories.accessCodeRepository.clear();
        }
      });

      describe('Document Repository Tests', () => {
        it('should save and retrieve a document', async () => {
          // Given
          const document = new Document(
            'test-doc',
            'Test Title',
            'Test Content',
            new Date('2025-01-01T10:00:00.000Z'),
          );

          // When
          const saved = await repositories.documentRepository.save(document);
          const retrieved =
            await repositories.documentRepository.findById('test-doc');

          // Then
          expect(saved).toEqual(document);
          expect(retrieved).toEqual(document);
        });

        it('should return all documents', async () => {
          // Given
          const doc1 = new Document(
            'doc-1',
            'First',
            'Content 1',
            new Date('2025-01-01T09:00:00.000Z'),
          );
          const doc2 = new Document(
            'doc-2',
            'Second',
            'Content 2',
            new Date('2025-01-01T10:00:00.000Z'),
          );

          await repositories.documentRepository.save(doc1);
          await repositories.documentRepository.save(doc2);

          // When
          const all = await repositories.documentRepository.findAll();

          // Then
          expect(all).toHaveLength(2);
          expect(all.map((d) => d.id)).toContain('doc-1');
          expect(all.map((d) => d.id)).toContain('doc-2');
        });
      });

      describe('AccessCode Repository Tests', () => {
        it('should save and retrieve access codes', async () => {
          // Given - Create document first for foreign key constraint
          const document = new Document(
            'doc-for-access',
            'Document',
            'Content',
            new Date('2025-01-01T10:00:00.000Z'),
          );
          await repositories.documentRepository.save(document);

          const accessCode = new AccessCode(
            'TEST123',
            'doc-for-access',
            new Date('2025-01-01T12:00:00.000Z'),
          );

          // When
          const saved =
            await repositories.accessCodeRepository.save(accessCode);
          const retrieved =
            await repositories.accessCodeRepository.findByCode('TEST123');

          // Then
          expect(saved).toEqual(accessCode);
          expect(retrieved).toEqual(accessCode);
        });

        it('should return all access codes', async () => {
          // Given
          const document = new Document(
            'multi-doc',
            'Multi Document',
            'Multi Content',
            new Date('2025-01-01T10:00:00.000Z'),
          );
          await repositories.documentRepository.save(document);

          const code1 = new AccessCode('CODE1', 'multi-doc', null);
          const code2 = new AccessCode(
            'CODE2',
            'multi-doc',
            new Date('2025-01-01T15:00:00.000Z'),
          );

          await repositories.accessCodeRepository.save(code1);
          await repositories.accessCodeRepository.save(code2);

          // When
          const all = await repositories.accessCodeRepository.findAll();

          // Then
          expect(all).toHaveLength(2);
          expect(all.map((c) => c.code)).toContain('CODE1');
          expect(all.map((c) => c.code)).toContain('CODE2');
        });
      });

      describe('Integration Scenarios', () => {
        it('should handle document with multiple access codes', async () => {
          // Given
          const document = new Document(
            'shared-doc',
            'Shared Document',
            'Shared content',
            new Date('2025-01-01T10:00:00.000Z'),
          );
          await repositories.documentRepository.save(document);

          const codes = [
            new AccessCode('SHARE1', 'shared-doc', null),
            new AccessCode(
              'SHARE2',
              'shared-doc',
              new Date('2025-01-01T16:00:00.000Z'),
            ),
            new AccessCode(
              'SHARE3',
              'shared-doc',
              new Date('2025-01-01T14:00:00.000Z'),
            ),
          ];

          // When
          for (const code of codes) {
            await repositories.accessCodeRepository.save(code);
          }

          // Then
          const retrievedDocument =
            await repositories.documentRepository.findById('shared-doc');
          const retrievedCodes =
            await repositories.accessCodeRepository.findAll();

          expect(retrievedDocument).toEqual(document);
          expect(retrievedCodes).toHaveLength(3);
          expect(
            retrievedCodes.every((c) => c.documentId === 'shared-doc'),
          ).toBe(true);
        });
      });
    });
  });
});
