import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  UseFilters,
} from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../infrastructure/services/prisma.service';
import { DatabaseConnectionExceptionFilter } from './filters/database-connection-exception.filter';

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ready';
  database: 'connected' | 'not-configured';
}

@Controller()
@UseFilters(DatabaseConnectionExceptionFilter)
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async readiness(): Promise<ReadinessResponse> {
    const dbConfig = this.configService.database;

    // If no database is configured, that's ok for development
    if (!dbConfig.hasDatabase) {
      return {
        status: 'ready',
        database: 'not-configured',
      };
    }

    // If database is configured, verify connection
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'connected',
      };
    } catch (error) {
      // Database connection failed - return 503
      throw new DatabaseConnectionError('Database connection failed', error);
    }
  }
}

export class DatabaseConnectionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}
