# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-06

### Added

#### Core Features
- **Document Ingest API** (`POST /api/v1/documents`) - Provider backend can ingest documents and receive secure access codes
- **Document Access API** (`GET /api/public/:accessCode`) - Clients can access documents using valid access codes
- **Health Monitoring** (`GET /api/health`, `GET /api/ready`) - System health and readiness endpoints

#### Architecture
- **Clean Architecture Implementation** with domain/application/infrastructure layers
- **NestJS Framework** with TypeScript and dependency injection
- **PostgreSQL Database** with Prisma ORM for data persistence
- **Docker Support** with multi-stage builds for production deployment

#### Security & Validation
- **Secure Access Codes** - 8-character alphanumeric codes with unambiguous characters
- **Document Expiration** - Optional expiration for time-limited access
- **Input Validation** - Comprehensive validation for all endpoints
- **Error Handling** - Proper HTTP status codes (404, 410, 400, 500)

#### Testing Framework
- **Unit Tests** (108 tests) - Complete domain and application logic coverage
- **Integration Tests** - Database integration validation
- **E2E Tests** (11 tests) - Full API workflow testing with real database
- **CI/CD Pipeline** - Automated testing on GitHub Actions with PostgreSQL service

#### Production Features
- **Kubernetes Deployment** - Ready for production with proper secrets management
- **Database Migrations** - Prisma-based schema management
- **Environment Configuration** - Flexible configuration for different environments
- **Monitoring** - Health checks and readiness probes for orchestration

### Technical Implementation

#### Document Ingest Flow
- Provider backend submits document (title, content, optional expiration)
- System generates unique document ID and secure access code
- Returns `{id, accessCode}` response for provider tracking
- No deduplication - each POST creates new document/code pair

#### Document Access Flow
- Client requests document using access code
- System validates code existence and expiration
- Returns document data `{title, content, createdAt}` for valid codes
- Proper error responses: 404 for invalid, 410 for expired codes

#### Database Schema
- **Documents Table** - id, title, content, createdAt
- **Access Codes Table** - code, documentId, expiresAt (nullable)
- **Foreign Key Relationship** - Access codes link to documents with cascade delete

#### API Compliance
- **RESTful Design** - Proper HTTP methods and status codes  
- **JSON API** - Consistent request/response formats
- **Error Standardization** - Uniform error response structure
- **No Data Leakage** - Responses contain only necessary fields

### Infrastructure

#### CI/CD Pipeline
- **Quality Gates** - Unit tests, linting, build validation
- **E2E Testing** - PostgreSQL service with complete integration testing
- **Automated Deployment** - Production and development environment deployment
- **Migration Handling** - Automatic database schema updates

#### Database Configuration
- **Local Development** - k3d cluster with PostgreSQL
- **CI Environment** - PostgreSQL 15 service with proper health checks
- **Production** - Kubernetes secrets for secure credential management

### Development Experience

#### Testing
- **Fast Unit Tests** - No external dependencies, immediate feedback
- **Reliable E2E Tests** - Database isolation, proper cleanup
- **CI Stability** - Serial execution, transaction management, extended timeouts

#### Code Quality
- **ESLint Configuration** - TypeScript-aware linting with Prettier
- **Type Safety** - Full TypeScript coverage with strict configuration
- **Clean Architecture** - Proper dependency injection and layer separation

[1.0.0]: https://github.com/julienreichel/oc-client-backend/releases/tag/v1.0.0