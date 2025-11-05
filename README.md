# OC Client Backend

A client-facing backend service in a two-backend architecture. Receives documents from a provider backend and serves them to clients via access codes.

## Architecture

Built with NestJS using **Clean Architecture** principles:

- **Domain Layer** (`src/domain/`): Business entities and repository interfaces
- **Application Layer** (`src/application/`): Use cases and business logic orchestration
- **Infrastructure Layer** (`src/infrastructure/`): Database implementations and external services
- **Presentation Layer** (`src/adapters/`): HTTP controllers and DTOs

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- kubectl configured for oc-client namespace
- oc-infra PostgreSQL running locally

### Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd oc-client-backend
npm install

# 2. Copy environment template
cp .env.test.example .env

# 3. Start database port-forward (keep running)
npm run db:port-forward

# 4. Apply migrations and run tests
npm run db:migrate
npm run test:integration
npm test
```

## Database

### Local Development

The `.env.test.example` template contains configuration matching oc-infra setup:

```
DATABASE_URL="postgresql://app:StrongLocalPass@localhost:5432/db?schema=public"
```

### Commands

```bash
# Database operations
npm run db:port-forward    # Connect to cluster PostgreSQL
npm run db:migrate         # Apply migrations
npm run db:generate        # Generate Prisma client
npm run db:reset           # Reset database (dev only)

# Testing
npm test                   # Unit tests (no DB required)
npm run test:integration   # Integration tests (requires DB)
npm run test:e2e          # End-to-end tests
npm run test:cov          # Coverage report
```

### Production

Production deployments use Kubernetes secrets (`envFrom: secretRef: name: db`).

## Development

```bash
# Development server
npm run start:dev

# Production build
npm run build
npm run start:prod

# Code quality
npm run lint
npm run format
```

## Troubleshooting

### Port-Forward Issues

```bash
# Verify kubectl access
kubectl get pods -n oc-client
kubectl get svc -n oc-client pg
```

### Database Issues

```bash
# Test direct connection (after port-forward)
psql postgresql://app:StrongLocalPass@localhost:5432/db

# Run unit tests only (no DB)
npm test -- --testPathIgnorePatterns="integration.spec.ts"
```

### Environment Issues

```bash
# Check if DATABASE_URL is loaded
node -e "console.log(process.env.DATABASE_URL)"
```

## License

MIT
