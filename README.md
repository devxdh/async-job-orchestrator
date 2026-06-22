# 🛠️ Async Job Orchestrator (V1)

A high-integrity, concurrency-safe job queue system built with **Node.js, TypeScript, and PostgreSQL**. 

This project is more than just a CRUD application; it is a practical implementation of a **database-backed job orchestrator** that uses advanced PostgreSQL locking to coordinate multiple workers in a distributed-style environment.

---

## 🚀 Key Features

*   **Atomic Job Claiming:** Uses `FOR UPDATE SKIP LOCKED` to ensure that concurrent workers can claim jobs without race conditions or double-processing.
*   **Priority-Driven Queue:** Automatically sorts jobs by `priority` (High, Medium, Low) and `age` (FIFO).
*   **Deterministic Retries:** Built-in logic to retry failed jobs up to a `max_attempts` limit before marking them as permanently failed.
*   **Stuck-Job Recovery:** A background scheduler automatically rescues jobs stuck in the `processing` state (e.g., due to worker crashes) every 30 minutes.
*   **Role-Based Access (RBAC):** Strict separation between **Admins** (who create and monitor jobs) and **Workers** (who execute them).
*   **Audit-Ready Architecture:** Every state transition is atomic and recorded in the database.

---

## 🛠️ Tech Stack

*   **Backend:** Node.js 20+ & Express 5 (Alpha/Beta features for better async handling).
*   **Language:** TypeScript 5+ (Strict mode).
*   **Database:** PostgreSQL (utilizing Enums, UUIDs, and optimized B-Tree indices).
*   **Validation:** Zod (Type-safe schema validation for all API inputs).
*   **Testing:** Vitest (High-speed integration tests with isolated DB environments).
*   **Containerization:** Docker & Docker Compose (Production-ready multi-stage builds).

---

## 🚦 Quick Start

### 1. Run with Docker (Recommended)
The fastest way to get the full stack (API + Database) running:

```bash
docker compose up --build
```
*   **API:** `http://localhost:3000`
*   **DB:** `localhost:5432` (User/Pass: `postgres/postgres`)

### 2. Local Development
If you prefer running outside of Docker:

1.  **Install dependencies:** `pnpm install`
2.  **Environment:** Copy `.env.example` to `.env` and configure your Postgres credentials.
3.  **Schema:** Apply `src/database/schema.sql` to your local database.
4.  **Start Dev Server:** `pnpm dev` (Watch mode with `tsx`).

---

## 🧪 Testing & Quality

We prioritize "Verified Code." Our integration tests simulate real user flows:

```bash
pnpm test          # Run all tests
pnpm test:watch    # Run in watch mode
pnpm typecheck     # Verify TypeScript integrity
```

---

## 📡 API Architecture

### **Authentication**
*   `POST /auth/signup` - Create a new user (Admin or Worker).
*   `POST /auth/login` - Exchange credentials for a JWT.
*   `POST /auth/remove` - Removes a user(Admin or Worker).

### **Job Management (Admin Only)**
*   `POST /job/` - Submit a new job with a JSON payload and priority.
*   `GET /job/` - Cursor-paginated view of the entire queue.

### **Worker Operations (Worker Only)**
*   `GET /job/next` - **The Heartbeat:** Claims the highest-priority available job using atomic row-locking.
*   `POST /job/:id/process` - Reports success or failure. Triggers the retry state machine.

---

## 🛡️ Core Design Decisions

1.  **Why Postgres as a Coordinator?** By using `SKIP LOCKED`, we avoid the complexity of Redis/RabbitMQ while maintaining 100% data durability and ACID compliance.
2.  **Why JSONB?** Job payloads are stored as JSONB, allowing the orchestrator to handle any type of task (emails, image processing, etc.) without schema changes.
3.  **Why Background Recovery?** In real-world systems, workers crash. Our `job.scheduler.ts` ensures that "orphaned" jobs are eventually returned to the queue, guaranteeing eventual completion.

---

**Current Status:** Version 1.0 (Stable).  
*Architected for Scalability. Optimized for Integrity.*
