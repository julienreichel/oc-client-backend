import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { CreateDocumentAndAccessCodeUseCase } from '../../application/use-cases/create-document-and-access-code';
import { CreateDocument } from './dtos/create-document';
import { CreateDocumentResponse } from './dtos/create-document-response';
import { DomainExceptionFilter } from './filters/domain-exception.filter';

@Controller('v1/documents')
@UseFilters(DomainExceptionFilter)
export class DocumentController {
  constructor(
    private readonly createDocumentAndAccessCodeUseCase: CreateDocumentAndAccessCodeUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDocument(
    @Body() createDocument: CreateDocument,
  ): Promise<CreateDocumentResponse> {
    const result = await this.createDocumentAndAccessCodeUseCase.execute({
      title: createDocument.title,
      content: createDocument.content,
      expiresIn: createDocument.expiresIn,
    });

    return {
      accessCode: result.accessCode,
    };
  }
}
