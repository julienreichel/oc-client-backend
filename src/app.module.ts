import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthController } from './adapters/http/health.controller';
import { DocumentController } from './adapters/http/document.controller';
import { PublicController } from './adapters/http/public.controller';
import { PersistenceModule } from './infrastructure/persistence.module';
import { ConfigModule } from './config/config.module';
import { CreateDocumentAndAccessCodeUseCase } from './application/use-cases/create-document-and-access-code';
import { GetDocumentByAccessCodeUseCase } from './application/use-cases/get-document-by-access-code';

@Module({
  imports: [ConfigModule, PersistenceModule],
  controllers: [HealthController, DocumentController, PublicController],
  providers: [
    AppService,
    CreateDocumentAndAccessCodeUseCase,
    GetDocumentByAccessCodeUseCase,
  ],
})
export class AppModule {}
