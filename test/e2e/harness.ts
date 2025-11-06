import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/infrastructure/services/prisma.service';
import { AppModule } from '../../src/app.module';

/**
 * E2E Test Harness for OC Client Backend
 *
 * Provides shared utilities for end-to-end testing including:
 * - App bootstrap matching main.ts configuration
 * - Database reset between tests
 * - Request factory with proper typing
 * - Clean setup/teardown lifecycle
 *
 * Usage:
 * ```typescript
 * import { createApp, resetDb, createRequest } from './harness';
 *
 * describe('Feature Tests', () => {
 *   let app: INestApplication;
 *   let request: SuperTest<SupertestTest>;
 *
 *   beforeAll(async () => {
 *     app = await createApp();
 *     request = createRequest(app);
 *   });
 *
 *   afterEach(async () => {
 *     await resetDb(app);
 *   });
 *
 *   afterAll(async () => {
 *     await app?.close();
 *   });
 * });
 * ```
 */

let moduleRef: TestingModule | null = null;
let prismaService: PrismaService | null = null;

/**
 * Creates and configures a NestJS application instance matching main.ts bootstrap.
 *
 * Configuration includes:
 * - Global API prefix ('/api')
 * - ValidationPipe with transform and whitelist
 * - Production-like middleware setup
 *
 * @returns Configured INestApplication instance ready for testing
 */
export async function createApp(): Promise<INestApplication> {
  // Create module only once per test suite for performance
  if (!moduleRef) {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Cache PrismaService for database operations
    prismaService = moduleRef.get<PrismaService>(PrismaService);
  }

  const app = moduleRef.createNestApplication();

  // Apply same configuration as main.ts
  app.setGlobalPrefix('api');

  // Add production ValidationPipe configuration
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Creates a Supertest request instance for the given app.
 *
 * @param app - NestJS application instance
 * @returns Supertest request factory
 */
export function createRequest(app: INestApplication) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return request(app.getHttpServer());
}

/**
 * Resets the database by truncating all test data.
 *
 * Truncates tables in dependency order:
 * 1. access_codes (has foreign key to documents)
 * 2. documents (parent table)
 *
 * Uses TRUNCATE CASCADE for clean, fast reset without affecting schema.
 *
 * @param app - NestJS application instance (for PrismaService access)
 */
export async function resetDb(app: INestApplication): Promise<void> {
  if (!prismaService) {
    prismaService = app.get<PrismaService>(PrismaService);
  }

  // Reset database tables in dependency order to avoid deadlocks
  // Truncate child tables first, then parent tables
  await prismaService.$transaction(async (tx) => {
    await tx.$executeRaw`TRUNCATE TABLE access_codes RESTART IDENTITY CASCADE`;
    await tx.$executeRaw`TRUNCATE TABLE documents RESTART IDENTITY CASCADE`;
  });
}

/**
 * Seeds the database with test data for consistent test scenarios.
 *
 * @param app - NestJS application instance
 * @param data - Optional seed data configuration
 */
export async function seedDb(
  app: INestApplication,
  data: {
    documents?: Array<{
      id: string;
      title: string;
      content: string;
      accessCodes?: Array<{
        code: string;
        expiresAt?: Date;
      }>;
    }>;
  } = {},
): Promise<void> {
  if (!prismaService) {
    prismaService = app.get<PrismaService>(PrismaService);
  }

  // Create documents with access codes in a transaction for atomicity
  if (data.documents && data.documents.length > 0) {
    await prismaService.$transaction(async (tx) => {
      for (const doc of data.documents!) {
        await tx.document.create({
          data: {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            createdAt: new Date(),
            accessCodes: {
              create:
                doc.accessCodes?.map((ac) => ({
                  code: ac.code,
                  expiresAt: ac.expiresAt,
                })) || [],
            },
          },
        });
      }
    });
  }
}

/**
 * Advances system time for expiration testing.
 *
 * Note: This is a placeholder for time manipulation functionality.
 * If the application implements a ClockPort interface, this function
 * should be updated to use that mechanism instead of setTimeout.
 *
 * @param milliseconds - Time to advance in milliseconds
 */
export async function advanceTime(milliseconds: number): Promise<void> {
  // For now, use setTimeout as a simple delay
  // TODO: Implement proper time manipulation if ClockPort is added to the domain
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Creates a test document with a valid access code for common test scenarios.
 *
 * @param app - NestJS application instance
 * @param overrides - Optional field overrides
 * @returns Created document and access code data
 */
export async function createTestDocument(
  app: INestApplication,
  overrides: {
    id?: string;
    title?: string;
    content?: string;
    accessCode?: string;
    expiresAt?: Date;
  } = {},
): Promise<{
  document: { id: string; title: string; content: string };
  accessCode: { code: string; expiresAt: Date | null };
}> {
  const documentId = overrides.id || `doc-${Date.now()}`;
  const accessCode = overrides.accessCode || `code-${Date.now()}`;

  await seedDb(app, {
    documents: [
      {
        id: documentId,
        title: overrides.title || 'Test Document',
        content: overrides.content || 'Test content for document',
        accessCodes: [
          {
            code: accessCode,
            expiresAt: overrides.expiresAt,
          },
        ],
      },
    ],
  });

  // Small delay to ensure data is committed in CI environment
  await new Promise((resolve) => setTimeout(resolve, 10));

  return {
    document: {
      id: documentId,
      title: overrides.title || 'Test Document',
      content: overrides.content || 'Test content for document',
    },
    accessCode: {
      code: accessCode,
      expiresAt: overrides.expiresAt || null,
    },
  };
}

/**
 * Waits for rate limiting to reset by checking response headers.
 *
 * @param requestFactory - Supertest request instance
 * @param endpoint - Endpoint to test
 * @param maxWaitMs - Maximum wait time in milliseconds
 */
export async function waitForRateLimitReset(
  requestFactory: ReturnType<typeof createRequest>,
  endpoint: string,
  maxWaitMs: number = 5000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await requestFactory.get(endpoint);

    // If we're not rate limited, we're good
    if (response.status !== 429) {
      return;
    }

    // Check for retry-after header
    const retryAfter = response.headers['retry-after'];
    if (retryAfter && typeof retryAfter === 'string') {
      const waitMs = parseInt(retryAfter, 10) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return;
    }

    // Default backoff
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Rate limit did not reset within ${maxWaitMs}ms`);
}

/**
 * Global teardown to ensure clean test environment.
 * Call this in afterAll hooks to prevent hanging handles.
 */
export async function teardownHarness(): Promise<void> {
  if (prismaService) {
    await prismaService.$disconnect();
    prismaService = null;
  }

  if (moduleRef) {
    await moduleRef.close();
    moduleRef = null;
  }
}
