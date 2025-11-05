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

### K3D Cluster Issues

If you get `connection refused` errors when running `npm run db:port-forward`:

```bash
# 1. Check if k3d cluster is running
k3d cluster list

# 2. If cluster exists but kubectl fails, restart it
k3d cluster stop oc-local
k3d cluster start oc-local

# 3. Update kubeconfig if server address is corrupted
k3d kubeconfig write oc-local --output ~/.kube/config

# 4. Verify kubectl connectivity
kubectl get nodes
kubectl get svc -n oc-client
```

**Common Issue**: After Docker restarts, k3d clusters may have corrupted kubeconfig with invalid server addresses like `0.0.0.0:62142`. The steps above will fix this.

### Port-Forward Issues

```bash
# Verify kubectl access and PostgreSQL service
kubectl get pods -n oc-client
kubectl get svc -n oc-client pg

# Test port-forward manually
kubectl port-forward -n oc-client svc/pg 5432:5432

# If port 5432 is busy, use alternative
kubectl port-forward -n oc-client svc/pg 5433:5432
# Then update DATABASE_URL port to :5433
```

### Database Issues

```bash
# Test direct connection (after port-forward)
psql postgresql://app:StrongLocalPass@localhost:5432/db

# Check if database exists and has tables
psql postgresql://app:StrongLocalPass@localhost:5432/db -c "\dt"

# Run unit tests only (no DB)
npm test -- --testPathIgnorePatterns="integration.spec.ts"

# Reset database if schema is corrupted
npm run db:reset
npm run db:migrate
```

### Environment Issues

```bash
# Check if DATABASE_URL is loaded
node -e "console.log(process.env.DATABASE_URL)"

# Verify .env file exists and is readable
cat .env | grep DATABASE_URL

# Test database connection from Node.js
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('✅ DB OK')).catch(console.error);
"
```

### CI/CD Migration Issues

If migrations fail in CI with "Job is invalid" or timeout errors:

```bash
# The reusable workflow in oc-infra now handles job cleanup automatically
# But if you need to clean up manually:
kubectl delete job oc-client-backend-migration -n oc-dev-client --ignore-not-found=true

# Check migration job logs
kubectl logs job/oc-client-backend-migration -n oc-dev-client
```

## License

MIT
