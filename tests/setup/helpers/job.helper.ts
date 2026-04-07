import { db } from "@src/config/db.config";
import type { JobPayloadType } from "@src/modules/job/job.schema";

export const buildJobPayload = (priority: JobPayloadType["priority"]): JobPayloadType => ({
    recipient: `${priority}@example.com`,
    title: `${priority.toUpperCase()} priority job`,
    description: `Process the ${priority} priority job and send the follow up email to the target user.`,
    priority,
});

export type SeedJobOptions = {
    payload: JobPayloadType;
    createdBy: string;
    status?: "pending" | "processing" | "success" | "failed";
    attempts?: number;
    maxAttempts?: number;
    createdAt?: string;
    assignedWorkerId?: string | null;
    lockedAt?: string | null;
};

export const seedJob = async ({
    payload,
    createdBy,
    status = "pending",
    attempts = 0,
    maxAttempts = 3,
    createdAt,
    assignedWorkerId = null,
    lockedAt = null,
}: SeedJobOptions) => {
    const result = await db.query(
        `
            INSERT INTO job (
                payload,
                created_by,
                status,
                attempts,
                max_attempts,
                created_at,
                updated_at,
                assigned_worker_id,
                locked_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                COALESCE($6::timestamptz, NOW()),
                COALESCE($6::timestamptz, NOW()),
                $7,
                $8
            )
            RETURNING *
        `,
        [payload, createdBy, status, attempts, maxAttempts, createdAt ?? null, assignedWorkerId, lockedAt]
    );

    return result.rows[0];
};

export const getJobById = async (jobId: string) => {
    const result = await db.query(
        `SELECT * FROM job WHERE id = $1`,
        [jobId]
    );

    return result.rows[0] ?? null;
};
