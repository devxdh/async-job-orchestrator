# 🛠️ Project Summary: Async Job Orchestrator (Current State)

### **1. Core Architectural Mission**
The `async-job-orchestrator` is a high-integrity, database-driven job queue system. It is designed to manage long-running or asynchronous tasks (like email delivery, data processing, or report generation) with a focus on **concurrency safety, atomic state transitions, and automatic recovery.**

### **2. Technical Stature & Complexity**
This is not a simple CRUD application. It employs several advanced backend patterns:

#### **A. Atomic Concurrency Control (The "Heart")**
The most critical part of the system is the **Job Claiming Engine**. Instead of selecting and then updating a job (which leads to race conditions), the system uses a single, atomic PostgreSQL query:
*   **Query Pattern:** `UPDATE job SET status = 'processing', assigned_worker_id = $1, ... WHERE id = (SELECT id FROM job WHERE status = 'pending' ... ORDER BY priority, created_at LIMIT 1 FOR UPDATE SKIP LOCKED)`.
*   **Significance:** The `FOR UPDATE SKIP LOCKED` clause allows hundreds of workers to hit the database simultaneously. PostgreSQL ensures that each worker grabs exactly one unique job without any collisions or double-processing.

#### **B. Database-Centric State Machine**
The database is the "Source of Truth" for the entire job lifecycle. 
*   **States:** `pending` ➡️ `processing` ➡️ `success` OR `failed`.
*   **Retry Logic:** If a job fails, the database logic automatically increments the `attempts` counter. If `attempts < max_attempts`, it resets to `pending` for another worker to try. If exhausted, it is permanently marked as `failed`.
*   **Prioritization:** Uses a `SMALLINT` priority system (1:High, 2:Medium, 3:Low) optimized for B-tree index sorting.

#### **C. Resiliency & Self-Healing**
*   **Background Recovery Scheduler:** The system boots a background process (`job.scheduler.ts`) that runs every 30 minutes. 
*   **The "Dead Worker" Fix:** It identifies jobs that have been in the `processing` state for more than 30 minutes (suggesting a worker crash) and automatically resets them to `pending` so they aren't lost forever.

#### **D. Security & Governance (RBAC)**
*   **Authentication:** JWT-based stateless authentication.
*   **Role-Based Access Control (RBAC):**
    *   **Admins:** Can create jobs and inspect the entire queue with cursor-based pagination.
    *   **Workers:** Can only claim the "next" job and report results for jobs assigned specifically to them.
*   **Validation:** Every API request is strictly validated at the edge using **Zod** schemas.

### **3. Data Model Summary**
*   **Users Table:** Handles UUIDs, bcrypt-hashed passwords, and the `user_role` Enum.
*   **Job Table:**
    *   **Payload:** Stores arbitrary data in `JSONB` for maximum flexibility.
    *   **Metadata:** Tracks `created_by`, `assigned_worker_id`, `locked_at`, and `last_error`.
    *   **Optimized Indices:** Custom indices exist for high-speed queue sorting and stuck-job recovery.

### **4. Tech Stack Breakdown**
*   **Runtime:** Node.js 20+ (using `tsx` for development and `tsup` for production).
*   **Database:** PostgreSQL (using the `pg` driver for raw SQL performance).
*   **API:** Express with a centralized error-handling middleware.
*   **Containerization:** Full Docker Compose setup with health-checked PostgreSQL service.
*   **Testing:** Vitest for high-speed integration testing with isolated test databases.

### **5. Current API Surface**
*   `POST /auth/signup` / `POST /auth/login`: Identity management.
*   `POST /job/`: (Admin Only) Create a job with priority.
*   `GET /job/`: (Admin Only) Cursor-paginated queue visibility.
*   `GET /job/next`: (Worker Only) Atomic claim of the highest-priority, oldest job.
*   `POST /job/:id/process`: (Worker Only) Report success or failure with built-in retry logic.
