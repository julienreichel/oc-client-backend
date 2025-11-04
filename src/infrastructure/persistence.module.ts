import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { PostgreSQLDocumentRepository } from './repositories/postgresql/document';
import { PostgreSQLAccessCodeRepository } from './repositories/postgresql/access-code';

@Module({
  providers: [
    PrismaService,
    {
      provide: 'DocumentRepository',
      useClass: PostgreSQLDocumentRepository,
    },
    {
      provide: 'AccessCodeRepository',
      useClass: PostgreSQLAccessCodeRepository,
    },
  ],
  exports: ['DocumentRepository', 'AccessCodeRepository', PrismaService],
})
export class PersistenceModule {}
