import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthController } from './adapters/http/health.controller';
import { DocumentController } from './adapters/http/document.controller';
import { PublicController } from './adapters/http/public.controller';
import { PersistenceModule } from './infrastructure/persistence.module';
import { ServicesModule } from './infrastructure/services.module';
import { ConfigModule } from './config/config.module';
import { CreateDocumentAndAccessCodeUseCase } from './application/use-cases/create-document-and-access-code';
import { GetDocumentByAccessCodeUseCase } from './application/use-cases/get-document-by-access-code';
import type { DocumentRepository } from './domain/entities/repositories/document-repository';
import type { AccessCodeRepository } from './domain/entities/repositories/access-code-repository';
import type { Clock } from './domain/services/clock';
import type { IdGenerator } from './domain/services/id-generator';
import type { AccessCodeGenerator } from './domain/services/access-code-generator';

@Module({
  imports: [ConfigModule, PersistenceModule, ServicesModule],
  controllers: [HealthController, DocumentController, PublicController],
  providers: [
    AppService,
    {
      provide: CreateDocumentAndAccessCodeUseCase,
      useFactory: (
        documentRepository: DocumentRepository,
        accessCodeRepository: AccessCodeRepository,
        clock: Clock,
        idGenerator: IdGenerator,
        accessCodeGenerator: AccessCodeGenerator,
      ) =>
        new CreateDocumentAndAccessCodeUseCase(
          documentRepository,
          accessCodeRepository,
          clock,
          idGenerator,
          accessCodeGenerator,
        ),
      inject: [
        'DocumentRepository',
        'AccessCodeRepository',
        'Clock',
        'IdGenerator',
        'AccessCodeGenerator',
      ],
    },
    {
      provide: GetDocumentByAccessCodeUseCase,
      useFactory: (
        accessCodeRepository: AccessCodeRepository,
        documentRepository: DocumentRepository,
        clock: Clock,
      ) =>
        new GetDocumentByAccessCodeUseCase(
          accessCodeRepository,
          documentRepository,
          clock,
        ),
      inject: ['AccessCodeRepository', 'DocumentRepository', 'Clock'],
    },
  ],
})
export class AppModule {}
