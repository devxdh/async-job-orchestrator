export const JobQueries = {
    create: `
    INSERT INTO job (created_by, payload)
    VALUES ($1, $2) 
    RETURNING id, payload, created_by, created_at
    `,

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
            CASE
                WHEN (payload->>'priority') = 'high' THEN 1
                WHEN (payload->>'priority') = 'medium' THEN 2
                ELSE 3
            END,
            created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, payload, status, locked_at
    `,

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