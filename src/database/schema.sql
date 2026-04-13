-- Types
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('worker', 'admin');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'success', 'failed');

-- Users Table Schema
CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Table Schema
CREATE TABLE job(
    id UUID PRIMARY KEY default gen_random_uuid(),
    
    priority SMALLINT NOT NULL DEFAULT 3, -- 1:high, 2:medium, 3:low
    status job_status NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),

    payload JSONB NOT NULL,
    last_error TEXT,
    assigned_worker_id UUID REFERENCES users(id),
    locked_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_queue_optimized
ON job (priority ASC, created_at ASC)
WHERE status = 'pending' AND attempts < max_attempts;

CREATE INDEX idx_job_stuck_recovery
ON job (locked_at)
WHERE status = 'processing';

CREATE INDEX idx_job_admin_list
ON job (status, created_at DESC)