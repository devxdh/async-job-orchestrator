-- Users Table Schema
create table users(
    id uuid primary key default gen_random_uuid(),
    email VARCHAR(255) unique not null,
    password text not null,
    role user_role not null,
    created_at timestamptz not null default now()
);

-- Job Table Schema
create table job(
    id UUID PRIMARY KEY default gen_random_uuid(),
    payload jsonb not null,
    status job_status not null default 'pending',
    attempts integer not null default 0,
    max_attempts integer not null default 3 check (max_attempts > 0),
    last_error text,
    assigned_worker_id UUID references users(id),
    locked_at timestamptz,
    created_by UUID not null references users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
    );


-- Types
create type user_role as enum ('worker', 'admin');
create type job_status as enum ('pending', 'processing', 'success', 'failed');