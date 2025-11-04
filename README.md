<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

OC Client Backend - A client-facing backend service in a two-backend architecture. Receives documents from a provider backend and serves them to clients via access codes. Built with NestJS using Clean Architecture patterns.

## Architecture

This project follows **Clean Architecture** principles:

- **Domain Layer** (`src/domain/`): Business entities and repository interfaces
- **Application Layer** (`src/application/`): Use cases and business logic orchestration
- **Infrastructure Layer** (`src/infrastructure/`): Database implementations and external services
- **Presentation Layer** (`src/adapters/`): HTTP controllers and DTOs

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- kubectl configured for oc-client namespace
- oc-infra PostgreSQL running locally

### Quick Setup
```bash
# 1. Clone and install dependencies
$ git clone <repository-url>
$ cd oc-client-backend
$ npm install

# 2. Start database port-forward (keep this running)
$ npm run db:port-forward

# 3. In another terminal: apply migrations and run tests
$ npm run db:migrate
$ npm run test:integration
$ npm test  # runs all tests
```

## Database Setup

### Local Development

The `.env` file contains local development database configuration that matches the oc-infra setup:

```
DATABASE_URL="postgresql://app:StrongLocalPass@localhost:5432/db?schema=public"
```

**Prerequisites:**
- oc-infra PostgreSQL running locally
- kubectl configured for oc-client namespace

**Quick Start:**
```bash
# 1. Start port-forward to local database (in one terminal)
$ npm run db:port-forward

# 2. Apply migrations (in another terminal)  
$ npm run db:migrate

# 3. Run integration tests
$ npm run test:integration
```

### Production/Cluster Database

In production, `DATABASE_URL` is provided via Kubernetes secrets (`envFrom: secretRef: name: db`).

### Database Migrations

```bash
# Generate Prisma client
$ npm run db:generate

# Apply migrations to cluster database
$ npm run db:migrate

# Reset database (development only)
$ npm run db:reset
```

**Note:** When running migrations against cluster DB, make sure you have DATABASE_URL pointing to the cluster or use port-forward first.

## Development

```bash
# development mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing

```bash
# unit tests (always run - no external dependencies)
$ npm test

# integration tests (requires DATABASE_URL)
$ npm run test:integration

# all tests including e2e
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### Testing Against Cluster Database

1. **Setup port-forward to cluster PostgreSQL:**

   ```bash
   npm run db:port-forward
   ```

2. **Set DATABASE_URL in your environment:**

   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
   ```

3. **Run integration tests:**
   ```bash
   npm run test:integration
   ```

**Note:** Integration tests are automatically skipped if `DATABASE_URL` is not set, with a clear warning message.

## Troubleshooting

### Port-Forward Issues
```bash
# Check if kubectl is configured
$ kubectl get pods -n oc-client

# Check if PostgreSQL service exists
$ kubectl get svc -n oc-client pg
```

### Database Connection Issues
```bash
# Test direct connection (after port-forward is running)
$ psql postgresql://app:StrongLocalPass@localhost:5432/db

# Check if migrations need to be applied
$ npm run db:migrate
```

### Test Issues
```bash
# Run only unit tests (no database required)
$ npm test -- --testPathIgnorePatterns="integration.spec.ts"

# Check if DATABASE_URL is loaded
$ node -e "console.log(process.env.DATABASE_URL)"
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
