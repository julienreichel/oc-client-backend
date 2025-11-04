import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentController } from './adapters/http/document.controller';
import { PublicController } from './adapters/http/public.controller';
import { DomainExceptionFilter } from './adapters/http/filters/domain-exception.filter';
import { CreateDocumentAndAccessCodeUseCase } from './application/use-cases/create-document-and-access-code';
import { GetDocumentByAccessCodeUseCase } from './application/use-cases/get-document-by-access-code';

@Module({
  controllers: [DocumentController, PublicController],
  providers: [
    // Global validation pipe
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    // Use cases (dependencies will be injected when the module is configured)
    CreateDocumentAndAccessCodeUseCase,
    GetDocumentByAccessCodeUseCase,
  ],
})
export class HttpModule {}
