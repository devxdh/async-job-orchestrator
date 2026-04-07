# Project Overview

## What This Project Is

`async-job-orchestrator` is a small backend service for managing asynchronous jobs with explicit queue behavior.

It is not just a CRUD wrapper around a `job` table. The useful part of the project is the workflow:

- admins create jobs
- workers claim the next available job
- workers report whether the work succeeded or failed
- failed work can be retried
- stuck work can be recovered automatically

This makes it a compact example of a queue-backed job processing system with role-based access and database-driven coordination.

## What Problem It Solves

In many systems, work should not be handled immediately inside the request that created it.

Examples:

- sending emails
- generating reports
- processing imported data
- calling slow third-party APIs

Those jobs need to be:

- stored durably
- processed by workers later
- retried when failures are temporary
- prevented from being processed twice at the same time

This project implements that model in a simple but realistic way using PostgreSQL as the source of truth.

## Core Model

The system revolves around a `job` record with:

- a `payload`
- a `status`
- retry counters
- assignment metadata
- timestamps for claiming and recovery

The lifecycle is:

```text
pending -> processing -> success
pending -> processing -> pending
pending -> processing -> failed
```

Meaning:

- `pending`: waiting in queue
- `processing`: currently claimed by a worker
- `success`: completed
- `failed`: permanently failed after retries are exhausted

## Roles In The System

There are two user roles:

### Admin

Admin users are responsible for queue management:

- creating jobs
- listing jobs

They do not process jobs.

### Worker

Worker users are responsible for job execution:

- claiming the next available job
- reporting the outcome of that job

They do not create or inspect the full queue.

This split keeps the API aligned with operational responsibility.

## Endpoint Overview

### Auth Endpoints

#### `POST /auth/signup`

Creates a user with a role.

Why it exists:
- makes it easy to bootstrap users for local use and testing

#### `POST /auth/login`

Authenticates a user and returns a JWT.

Why it exists:
- all protected job routes rely on authenticated user context

#### `POST /auth/remove`

Deletes the authenticated user.

Why it exists:
- keeps the auth flow complete for the project
- useful for integration testing authenticated deletion behavior

### Job Endpoints

All `/job/*` routes require authentication.

#### `POST /job/`

Creates a new job.

Allowed role:
- admin

What it does:
- validates the incoming payload
- stores the job as `pending`
- records who created it

Why this approach:
- job creation is separated from job execution
- the queue begins from persisted state, not in-memory state

#### `GET /job/`

Lists jobs with optional filtering and cursor pagination.

Allowed role:
- admin

What it does:
- returns jobs ordered by newest first
- supports filtering by `status`
- supports cursor-based pagination using `created_at`

Why this approach:
- admins need visibility into queue state
- cursor pagination is better aligned with ordered event-like data than naive offset pagination

#### `GET /job/next`

Claims the next available job for a worker.

Allowed role:
- worker

What it does:
- chooses one eligible `pending` job
- prefers `high` priority over `medium` and `low`
- prefers older jobs within the same priority
- marks the chosen job as `processing`
- assigns it to the current worker
- locks it with a timestamp

Why this approach:
- workers should not choose jobs manually
- queue selection should happen centrally and deterministically
- claiming and state mutation should happen together

#### `POST /job/:id/process`

Reports job completion or failure.

Allowed role:
- worker

What it does:
- only updates jobs currently assigned to that worker
- on success, marks the job `success`
- on failure, increments attempts
- if retries remain, sends the job back to `pending`
- if retries are exhausted, marks the job `failed`
- clears assignment and lock state

Why this approach:
- worker ownership matters
- queue retry policy should be enforced in one place
- job state should transition atomically

## Why PostgreSQL Was Chosen As The Coordinator

This project uses PostgreSQL not just for storage, but also for queue coordination.

That decision matters.

The queue logic is database-backed, which means:

- job state is durable
- selection logic is centralized
- multiple workers can coordinate through the database

This is a reasonable approach for a version-one queue system because it avoids introducing extra infrastructure like Redis streams, RabbitMQ, or Kafka before they are necessary.

It keeps the system smaller while still teaching real queue semantics.

## Why `GET /job/next` Uses A Database Claiming Query

The next-job route is the most important queue endpoint.

Instead of:

1. selecting a job in application code
2. then updating it in a second step

the project uses one database mutation-driven claim flow.

Why:

- reduces race conditions
- keeps selection and claiming tied together
- works better for concurrent workers

The query also uses PostgreSQL locking semantics so workers do not all grab the same job at once.

That is a core design choice of the project.

## Why Retry Logic Lives In The Database Update Path

The job outcome route calculates the next state based on:

- incoming worker result
- current attempt count
- maximum allowed attempts

This is intentional.

Why:

- retry rules are part of queue behavior, not just controller logic
- state transitions are easier to reason about when they happen in one place
- the database update becomes the source of truth for whether a job returns to the queue or becomes permanently failed

## Why Stuck Job Recovery Exists

If a worker claims a job and crashes, that job can remain stuck in `processing`.

Without recovery:
- the job may never be picked again
- the queue becomes less reliable over time

This project starts a background recovery scheduler on server boot.

Its responsibility is simple:
- find long-stuck `processing` jobs
- move them back to `pending`
- clear assignment state

This is a practical safeguard for systems where workers are not guaranteed to finish cleanly.

## What The Project Intentionally Does Not Try To Be

This project is not trying to be:

- a distributed event platform
- a horizontally scaled orchestration engine
- a fully versioned migration framework
- a high-throughput benchmarked queue service

It is intentionally smaller than that.

The goal is to model the important ideas cleanly:

- job lifecycle
- retry policy
- queue ordering
- locking
- recovery
- role boundaries
- integration-tested backend behavior

## Why This Shape Is Good For Learning

This project is useful because it has enough real behavior to be meaningful without needing a large distributed stack.

It exposes important backend concepts in one place:

- validation
- authorization
- persistence
- database-driven coordination
- retries
- worker ownership
- pagination
- production-style containerization

That makes it a strong version-one project for learning practical backend system design.

## Summary

At a high level, this project is:

- a role-based async job API
- backed by PostgreSQL
- with deterministic job claiming
- retry-aware result reporting
- stuck-job recovery
- local and Docker-based execution paths

The main design choice throughout the codebase is consistency:

- persist first
- coordinate through the database
- keep role boundaries explicit
- keep queue behavior deterministic
- test the behavior through integration tests
