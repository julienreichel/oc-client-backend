import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { GetDocumentByAccessCodeUseCase } from '../../application/use-cases/get-document-by-access-code';
import { GetDocumentResponse } from './dtos/get-document-response';
import { DomainExceptionFilter } from './filters/domain-exception.filter';

@Controller('public')
@UseFilters(DomainExceptionFilter)
export class PublicController {
  constructor(
    private readonly getDocumentByAccessCodeUseCase: GetDocumentByAccessCodeUseCase,
  ) {}

  @Get(':accessCode')
  async getDocument(
    @Param('accessCode') accessCode: string,
  ): Promise<GetDocumentResponse> {
    const document = await this.getDocumentByAccessCodeUseCase.execute({
      code: accessCode,
    });

    return {
      title: document.title,
      content: document.content,
      createdAt: document.createdAt.toISOString(),
    };
  }
}
