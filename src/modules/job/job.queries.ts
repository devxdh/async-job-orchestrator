/**
 * These are all the SQL queries for our job system. 
 * I tried to keep them as efficient as possible.
 */
export const JobQueries = {
    /**
     * I decided to use a dedicated 'priority' column instead of putting it 
     * inside the JSON payload. This lets the database sort our jobs 
     * almost instantly using the B-tree index!
     */
    create: `
    INSERT INTO job (created_by, payload, priority)
    VALUES ($1, $2, $3) 
    RETURNING id, payload, priority, created_by, created_at
    `,

    /**
     * This query is the "heart" of our worker system. 
     * 
     * I'm using 'FOR UPDATE SKIP LOCKED' here. This is super important because 
     * it prevents two workers from grabbing the same job at the exact same time. 
     * It basically tells Postgres: "Lock this job for me, but if someone else 
     * already has a lock on a job, just skip it and find the next one."
     * 
     * We also sort by 'priority ASC' (so 1:High comes first) and 
     * 'created_at ASC' (so the oldest jobs get done first).
     */
    getNext: `
    UPDATE job
    SET
        status = 'processing',
        assigned_worker_id = $1,
        locked_at = NOW(),
        updated_at = NOW()
    WHERE id = (
        SELECT id FROM job
        WHERE status = 'pending'
        AND attempts < max_attempts
        ORDER BY
            priority ASC,
            created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, payload, status, locked_at
    `,

    /**
     * When a job is reported, I update the status and attempts. 
     * If a job fails, we increment 'attempts' and it might go 
     * back to 'pending' to try again later if attempts < max_attempts
     * else it is marked as failed and cannot be retried!
     */
    reportJob: `
    UPDATE job
    SET
        status = CASE
            WHEN $1 = 'success' THEN 'success'::job_status
            WHEN (attempts + 1) >= max_attempts THEN 'failed'::job_status
            ELSE 'pending'::job_status
        END,

        attempts = CASE
            WHEN $1 = 'failed' THEN attempts + 1
            ELSE attempts
        END,

        last_error = CASE
            WHEN $1 = 'success' THEN NULL
            ELSE $2
        END,

        assigned_worker_id = NULL,
        locked_at = NULL,
        updated_at = NOW()
    WHERE id = $3
        AND assigned_worker_id = $4
        AND status = 'processing'
    RETURNING id, status, attempts
    `,

    /**
     * Sometimes a worker might crash and leave a job "stuck" in processing. 
     * This query finds jobs that have been locked for more than 30 minutes 
     * and puts them back into 'pending' so another worker can try them.
     */
    recoverStuckJob: `
    UPDATE job
    SET
        status = 'pending',
        assigned_worker_id = NULL,
        locked_at = NULL,
        updated_at = NOW(),
        last_error = 'Job timed out: reset by recovery system'
    WHERE status = 'processing' AND locked_at < NOW() - INTERVAL '30 minutes'
    RETURNING id
    `,

    /**
     * This lists jobs for the admin. I'm using a descending sort on 'created_at' 
     * so they see the newest ones first.
     */
    listJob: `
    SELECT * FROM job
    WHERE
        ($1::job_status IS NULL OR status = $1)
        AND
        ($2::timestamptz IS NULL OR created_at < $2)
    ORDER BY created_at DESC
    LIMIT $3
    `,
}
