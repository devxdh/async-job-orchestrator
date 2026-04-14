export const setupQueries = {
    template: `
            CREATE EXTENSION IF NOT EXISTS pgcrypto;

            CREATE TYPE user_role AS ENUM ('worker', 'admin');
            CREATE TYPE job_status AS ENUM ('pending', 'processing', 'success', 'failed');
            
            CREATE TABLE users(
                id uuid primary key default gen_random_uuid(),
                email VARCHAR(255) unique not null,
                password text not null,
                role user_role not null,
                created_at timestamptz not null default now()
            );

            CREATE TABLE job(
                id UUID PRIMARY KEY default gen_random_uuid(),
                
                priority SMALLINT NOT NULL DEFAULT 3,
                status job_status not null default 'pending',
                attempts integer not null default 0,
                max_attempts integer not null default 3 check (max_attempts > 0),

                payload jsonb not null,
                last_error text,
                assigned_worker_id UUID references users(id),
                locked_at timestamptz,
                created_by UUID not null references users(id),
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now()
            );

            CREATE INDEX idx_job_queue_optimized
            ON job (priority ASC, created_at ASC)
            WHERE status = 'pending' AND attempts < max_attempts;

            CREATE INDEX idx_job_stuck_recovery
            ON job (locked_at)
            WHERE status = 'processing';

            CREATE INDEX idx_job_admin_list
            ON job (status, created_at DESC)
            `
}
