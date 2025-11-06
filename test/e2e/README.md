# E2E Test Harness Documentation

## Overview

The E2E test harness provides a comprehensive testing framework for the OC Client Backend, following Boston-style testing conventions with clear AAA structure (Arrange, Act, Assert).

## Features

- ✅ **Shared App Bootstrap**: Matches main.ts configuration exactly
- ✅ **Database Management**: Automatic reset between tests for isolation
- ✅ **Request Factory**: Properly typed Supertest integration
- ✅ **Seed Utilities**: Helper functions for test data creation
- ✅ **Clean Teardown**: Prevents hanging handles and resource leaks
- ✅ **Performance Optimized**: Module reuse within test suites for speed

## Usage

### Basic Setup

```typescript
import { INestApplication } from '@nestjs/common';
import {
  createApp,
  createRequest,
  resetDb,
  teardownHarness,
} from './e2e/harness';

describe('Feature Tests (e2e)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof createRequest>;

  beforeAll(async () => {
    app = await createApp();
    request = createRequest(app);
  });

  afterEach(async () => {
    await resetDb(app); // Clean database between tests
  });

  afterAll(async () => {
    await app?.close();
    await teardownHarness(); // Prevent hanging handles
  });

  it('should test feature functionality', async () => {
    // Given: Test setup
    // When: Action performed
    // Then: Assertions made
  });
});
```

### Advanced Usage with Test Data

```typescript
import { createTestDocument, seedDb } from './e2e/harness';

describe('Document Tests (e2e)', () => {
  // ... setup code ...

  it('should handle document expiration', async () => {
    // Given: A document with expired access code
    const testData = await createTestDocument(app, {
      id: 'expired-doc',
      title: 'Test Document',
      content: 'Test content',
      accessCode: 'test-code',
      expiresAt: new Date(Date.now() - 60000), // 1 minute ago
    });

    // When: Requesting with expired code
    const response = await request
      .get(`/api/public/${testData.accessCode.code}`)
      .expect(410);

    // Then: Should return gone status
    expect(response.body.message).toContain('expired');
  });
});
```

## API Reference

### Core Functions

#### `createApp(): Promise<INestApplication>`

Creates a NestJS application instance with production-like configuration:

- Global API prefix (`/api`)
- Validation pipes with transform and whitelist
- Module initialization and dependency injection

#### `createRequest(app: INestApplication)`

Returns a Supertest request factory with proper typing for the given app instance.

#### `resetDb(app: INestApplication): Promise<void>`

Truncates all test data from database tables:

- `access_codes` (with foreign key constraints)
- `documents` (parent table)
- Uses `TRUNCATE CASCADE` for performance and clean reset

#### `teardownHarness(): Promise<void>`

Global cleanup function to prevent hanging handles:

- Disconnects Prisma client
- Closes test module
- Should be called in `afterAll` hooks

### Utility Functions

#### `seedDb(app, data): Promise<void>`

Seeds database with structured test data for complex scenarios.

#### `createTestDocument(app, overrides): Promise<{document, accessCode}>`

Creates a test document with access code using sensible defaults.

#### `advanceTime(milliseconds): Promise<void>`

Time manipulation utility (placeholder for future ClockPort implementation).

#### `waitForRateLimitReset(request, endpoint, maxWaitMs): Promise<void>`

Utility for testing rate limiting behavior with automatic retry logic.

## Database Requirements

E2E tests require a running PostgreSQL database. Ensure:

1. **Database Connection**: Port-forward is active

   ```bash
   kubectl port-forward -n oc-client svc/pg 5433:5432
   ```

2. **Environment Configuration**: `.env` file has correct DATABASE_URL

   ```
   DATABASE_URL="postgresql://app:StrongLocalPass@localhost:5433/db?schema=public"
   ```

3. **Schema Applied**: Database has current schema
   ```bash
   npm run db:migrate
   ```

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- document-access.e2e-spec.ts

# Run with coverage
npm run test:e2e -- --coverage
```

## Best Practices

### Test Isolation

- Always use `resetDb()` in `afterEach` hooks
- Never depend on test execution order
- Use unique IDs for test data (timestamps or UUIDs)

### Performance

- Reuse app instance within test suites (`beforeAll` not `beforeEach`)
- Keep tests under 2-3 seconds each
- Use database truncation instead of individual deletions

### Readability

- Follow AAA pattern with comments: `// Given:`, `// When:`, `// Then:`
- Use descriptive test names that explain the scenario
- Group related tests in focused `describe` blocks

### Error Handling

- Always call `teardownHarness()` in `afterAll` to prevent leaks
- Handle async operations properly with `await`
- Use proper TypeScript typing for response bodies

## Troubleshooting

### Database Connection Issues

```
PrismaClientInitializationError: Authentication failed
```

**Solution**: Ensure database port-forward is running and `.env` has correct credentials.

### Hanging Handles

```
Jest did not exit one second after the test run has completed
```

**Solution**: Ensure `teardownHarness()` is called in all `afterAll` hooks.

### Test Timeout

```
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Solution**: Check database connectivity and consider increasing Jest timeout for e2e tests.
