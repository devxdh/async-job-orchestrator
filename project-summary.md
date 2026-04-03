# 🧠 Job Orchestrator System — Engineering Specification

## 📌 Overview

This project is a **backend job processing system** that simulates real-world async worker architectures.

The goal is to build a system that:

* processes jobs asynchronously
* handles concurrency safely
* enforces state transitions
* supports retries and failure handling
* demonstrates strong backend + database fundamentals

This is **not a queue system clone**, but a **correctness-first job system**.

---

## 🎯 Objectives

* Build a **stateful job lifecycle system**
* Ensure **no duplicate job execution**
* Handle **failures and retries**
* Demonstrate **transactional consistency**
* Maintain **clean backend architecture**

---

## 🧱 Tech Stack

* Node.js + TypeScript
* Express.js
* PostgreSQL
* Zod (validation)
* JWT (auth)

---

## 🗂️ Database Schema

### Users Table

* id (uuid, pk)
* email (unique)
* password_hash
* role (admin | worker)
* created_at

---

### Jobs Table

* id (uuid, pk)

* payload (jsonb, validated)

* status (pending | processing | success | failed)

* attempts (int, default 0)

* max_attempts (int, default 3)

* last_error (text, nullable)

* assigned_worker_id (uuid, nullable)

* locked_at (timestamp, nullable)

* created_by (uuid, fk → users.id)

* created_at

* updated_at

---

## 🔄 Job Lifecycle

Allowed transitions:

* pending → processing
* processing → success
* processing → failed

Rules:

* No skipping states
* No reverting success
* All transitions must be validated

---

## ⚙️ Core Features

### 1. Authentication & Authorization

* JWT-based authentication
* Roles:

  * admin → create/view jobs
  * worker → fetch/process jobs

---

### 2. Job Creation (Admin)

**POST /jobs**

* Validate payload (Zod)
* Insert job:

  * status = pending
  * attempts = 0
* Store created_by

---

### 3. Fetch Next Job (Worker) — CRITICAL

**GET /jobs/next**

Must use:

* DB transaction
* Row-level locking

Query:

```
SELECT * FROM jobs
WHERE status = 'pending'
AND attempts < max_attempts
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

Then update:

* status → processing
* assigned_worker_id
* locked_at = NOW()

Guarantees:

* no duplicate assignment
* safe parallel workers

---

### 4. Process Job (Worker)

**POST /jobs/:id/process**

Validation:

* job exists
* assigned to worker
* status = processing

Outcome:

#### Success:

* status → success

#### Failure:

* attempts += 1
* if attempts >= max_attempts:

  * status → failed
* else:

  * status → pending

Also:

* store last_error
* clear assigned_worker_id

---

### 5. Retry Logic

* automatic via:

  * status reset to pending
* no scheduler required

---

### 6. Job Listing (Admin)

**GET /jobs**

Features:

* filter by status
* pagination (limit + offset or cursor)
* sort by created_at

---

### 7. Validation Layer

* Zod schemas for:

  * auth inputs
  * job payload
  * route params

Goal:

* prevent invalid data at entry

---

### 8. Error Handling

* centralized error middleware
* consistent error format:

```
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description"
  }
}
```

---

### 9. Logging

Log key events:

* job assigned
* job completed
* job failed

Structure:

```
{
  event,
  jobId,
  workerId,
  timestamp
}
```

---

## 🔒 Correctness Requirements

* No duplicate job processing
* Strict state transitions enforced
* Worker can only process assigned job
* All critical operations inside transactions
* Input must always be validated

---

## 🚀 Enhancements (Differentiators)

These are NOT optional if aiming for strong backend signal.

---

### 1. Idempotency (Important)

* Prevent duplicate processing on retries
* Ensure safe re-execution

---

### 2. Stuck Job Recovery

* Detect jobs stuck in `processing`
* Condition:

  * locked_at older than threshold
* Reset:

  * status → pending

---

### 3. Indexing

Add indexes on:

* status
* created_at
* assigned_worker_id

---

### 4. Cursor Pagination (Advanced)

* Replace offset pagination
* More efficient for large datasets

---

### 5. Structured Logging

* Add request_id for tracing
* Correlate logs across flow

---

### 6. Metrics (Optional but strong signal)

Track:

* jobs processed
* success rate
* failure rate

---

### 7. Rate Limiting (Basic)

* prevent abuse on endpoints

---

## 🧠 Architecture Rules

* controller → service → db separation
* no business logic in routes
* services handle core logic
* middleware handles auth + validation

---

## ⚠️ Constraints

DO NOT:

* add Kafka / queues
* introduce microservices
* overcomplicate auth
* add unnecessary abstractions

---

## 🎯 Expected Outcome

By completing this system, you should demonstrate:

* understanding of concurrency at DB level
* ability to design stateful backend systems
* handling of failures and retries
* clean backend architecture

---

## 📌 Implementation Order

1. Schema setup
2. Auth + roles integration
3. Job creation
4. Fetch-next (transaction + locking)
5. Job processing logic
6. Retry handling
7. Listing + pagination
8. Logging + error handling
9. Enhancements

---

## 🧨 Final Note

This system is only valuable if:

* concurrency is handled correctly
* state transitions are enforced
* retries behave predictably

If those are weak, the entire project collapses into a basic CRUD app.

---
