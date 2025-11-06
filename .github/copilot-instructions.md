# OC Client Backend - AI Assistant Guidelines

## Project Context

This is a **client-facing backend** service in a two-backend architecture. It receives documents from a provider backend and serves them to clients via access codes. Built with NestJS using **Clean Architecture** patterns and designed for read-heavy workloads with PostgreSQL storage.

## Clean Architecture Structure

```
src/
├── domain/                    # Business logic core
│   ├── entities/              # Business entities with collocated tests
│   │   ├── document.ts/.spec.ts
│   │   ├── access-code.ts/.spec.ts
│   │   └── repositories/      # Repository interfaces
│   └── services/              # External service interfaces
├── application/               # Use cases and orchestration
│   └── use-cases/             # Business use cases with collocated tests
│       └── *.ts/.spec.ts
├── infrastructure/            # External concerns implementation
│   ├── repositories/memory/   # Repository implementations
│   ├── testing/               # Test utilities and fakes
│   └── services/             # External service implementations
└── adapters/                 # Presentation layer
    └── http/                 # HTTP controllers with collocated tests
        └── *.ts/.spec.ts

test/                         # E2E tests (separate)
└── *.e2e-spec.ts
```

## Development Workflow

```bash
# Start development server
npm run start:dev

# Run tests - Standard TypeScript with collocated tests
npm run test        # unit tests (*.spec.ts files collocated with source)
npm run test:e2e    # e2e tests (test/*.e2e-spec.ts)
npm run test:cov    # coverage reports to ../coverage

# Linting uses flat config (eslint.config.mjs), not legacy .eslintrc
npm run lint
```

## Project-Specific Conventions

### Clean Architecture Guidelines

- **Domain Layer**: Pure business logic, no external dependencies
- **Application Layer**: Orchestrates domain objects, depends only on domain interfaces
- **Infrastructure Layer**: Implements domain interfaces, handles external concerns
- **Presentation Layer**: HTTP handling, request/response transformation

### Testing Strategy (Standard TypeScript)

- **Unit Tests**: Collocated with source using `*.spec.ts` naming convention
- **E2E Tests**: Separate `test/` directory using `*.e2e-spec.ts` convention
- **Test Structure**: `describe` → `context` → `it` with Given/When/Then comments
- **Mock Strategy**: Mock all dependencies, test behavior not implementation
- **Coverage**: Reports generated to `../coverage` directory

### Commit Messages

Use conventional commits with Clean Architecture scope:

```
feat(domain): Add document expiration logic to DocumentEntity
fix(application): Prevent duplicate access codes in CreateDocumentUseCase
refactor(infrastructure): Extract database connection to separate service
feat(presentation): Add validation middleware for document endpoints
```

### TypeScript Configuration

- Uses `nodenext` module resolution with package.json exports
- Decorators enabled for NestJS (`experimentalDecorators: true`)
- Path mapping: `@/` points to `src/` (configured in Jest)
- Relaxed strictness: `noImplicitAny: false`, `strictBindCallApply: false`

### Dependency Flow Rules

- Domain depends on nothing external
- Application depends only on domain interfaces
- Infrastructure implements domain interfaces
- Presentation depends on application use cases

## Key Files for Context

- `KNOWLEDGE_BASE.md` - Business logic and component interactions
- `src/domain/entities/` - Core business entities with collocated tests
- `src/application/use-cases/` - Business use case implementations
- `src/infrastructure/testing/` - Test fakes and utilities
- `dockerfile` - Production-ready multi-stage build

## When Adding Features

1. **Start with Domain**: Define entities and repository interfaces first
2. **Create Use Cases**: Implement business logic in application layer
3. **Add Infrastructure**: Implement repository interfaces for data persistence
4. **Expose via Presentation**: Create controllers that call use cases
5. **Test Each Layer**: Unit test each layer independently with mocks
