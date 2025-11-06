import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DatabaseConnectionError } from '../health.controller';

@Catch(DatabaseConnectionError)
export class DatabaseConnectionExceptionFilter implements ExceptionFilter {
  catch(exception: DatabaseConnectionError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      status: 'not-ready',
      database: 'connection-failed',
      message: exception.message,
    });
  }
}
