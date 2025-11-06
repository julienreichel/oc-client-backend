import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  NotFoundError,
  AccessCodeExpiredError,
} from '../../../domain/errors/errors';

@Catch(NotFoundError, AccessCodeExpiredError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(
    exception: NotFoundError | AccessCodeExpiredError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    let errorCode: string;

    if (exception instanceof NotFoundError) {
      status = HttpStatus.NOT_FOUND;
      errorCode = 'NOT_FOUND';
    } else if (exception instanceof AccessCodeExpiredError) {
      status = HttpStatus.GONE; // Resource existed but is no longer available
      errorCode = 'ACCESS_CODE_EXPIRED';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
    }

    response.status(status).json({
      statusCode: status,
      error: errorCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
