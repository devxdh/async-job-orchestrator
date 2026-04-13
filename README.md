# Async Job Orchestrator

A small TypeScript/Express service for managing an async job queue with role-based access, job claiming, retries, and stuck-job recovery.

It is built for a simple but real workflow:

- admins create and inspect jobs
- workers fetch the next available job
- workers report job success or failure
- the system automatically recovers jobs stuck in `processing`

## Jump To

- [What It Does](#what-it-does)
- [Tech Stack](#tech-stack)
- [Quick Start With Docker](#quick-start-with-docker)
- [Local Development](#local-development)
- [Build And Run](#build-and-run)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)

## What It Does

This project models a basic job orchestration system where jobs move through a lifecycle:

- `pending`
- `processing`
- `success`
- `failed`

Jobs are prioritized and assigned with queue semantics:

- `high` priority jobs are claimed before `medium` and `low`
- older jobs are claimed before newer jobs within the same priority
- failed jobs are retried until `max_attempts` is reached
- stuck `processing` jobs are periodically recovered back into the queue

The utility of the project is in the behavior, not just the CRUD:

- worker-safe job claiming with database locking
- bounded retries
- role-based route protection
- integration-tested queue behavior

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Zod
- Vitest
- Docker / Docker Compose

## Quick Start With Docker

This is the fastest way to run the full stack.

### 1. Clone the repository

```bash
git clone https://github.com/devxdh/async-job-orchestrator.git
cd async-job-orchestrator
```

### 2. Start the app and database

```bash
docker compose up --build
```

The API will be available at:

```text
http://localhost:3000
```

PostgreSQL will be available at:

```text
localhost:5432
```

### 3. Stop the stack

```bash
docker compose down
```

If you want to remove the Postgres data volume too:

```bash
docker compose down -v
```

## Local Development

If you want to run the app outside Docker, you need a running PostgreSQL instance and a `.env` file.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create your local environment file

Use [.env.example](/.env.example) as the base.

Example:

```env
PORT=3000
JWT_SECRET=dev-secret-change-me

DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
DB_HOST=localhost
DB_NAME=jobapp
DB_TEST_NAME=jobapp_test
```

### 3. Create the database schema

Run the SQL from [schema.sql](/src/database/schema.sql) against your local Postgres database.

If you are already using the Docker Postgres service from this repo, the schema is created automatically on first startup of a fresh volume.

### 4. Start the dev server

```bash
pnpm dev
```

This runs the app with `tsx` in watch mode.

## Build And Run

This project has a production-style build flow.

### Typecheck

```bash
pnpm typecheck
```

### Build

```bash
pnpm build
```

This compiles the application into:

```text
dist/server.js
```

### Start the built app

```bash
pnpm start
```

The production runtime uses the built output, not `tsx`.

## Testing

Run the test suite with:

```bash
pnpm test
```

Watch mode:

```bash
pnpm test:watch
```

Vitest UI:

```bash
pnpm test:ui
```

Notes:

- integration tests use isolated test databases
- the test setup expects PostgreSQL access
- test database names are derived from `DB_TEST_NAME`

## Environment Variables

Core variables used by the app:

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP server port. Defaults to `3000`. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs. |
| `DB_USER` | Yes | PostgreSQL username. |
| `DB_PASSWORD` | Yes | PostgreSQL password. |
| `DB_HOST` | No | PostgreSQL host. Defaults to `localhost`. In Docker Compose this should be `postgres`. |
| `DB_PORT` | No | PostgreSQL port. Defaults to `5432`. |
| `DB_NAME` | Yes in normal runtime | Main application database name. |
| `DB_TEST_NAME` | No | Base test database name. Defaults to `jobapp_test`. |
| `DB_TEST_WORKERS` | No | Number of isolated test DB workers. Defaults to `4`. |

## API Overview

### Auth routes

Public:

- `POST /auth/signup`
- `POST /auth/login`

Authenticated:

- `POST /auth/remove`

### Job routes

All `/job/*` routes require authentication.

Admin routes:

- `POST /job/`
  Creates a new job.
- `GET /job/`
  Lists jobs with optional filters and cursor pagination.

Worker routes:

- `GET /job/next`
  Claims the next available job based on queue priority and age.
- `POST /job/:id/process`
  Reports job outcome as `success` or `failed`.

## Job Behavior Summary

Queue behavior is implemented around a few rules:

- only `pending` jobs can be claimed
- jobs that hit `max_attempts` are no longer claimable
- failed jobs are retried until attempts are exhausted
- workers can only report outcomes for jobs assigned to them
- stuck jobs in `processing` are periodically recovered

## Project Structure

```text
src/
  config/       environment and database configuration
  middleware/   auth, restriction, and error middleware
  modules/
    auth/       authentication module
    job/        job queue module
  database/     schema definition

tests/
  integration/  integration test suites
  setup/        test database and helper utilities
```

## Development Notes

- The app starts a background recovery scheduler on boot.
- Docker Compose uses a Postgres healthcheck before starting the app.
- The Docker setup is meant for a practical version-one workflow, not a full production orchestration setup.

## License

ISC
