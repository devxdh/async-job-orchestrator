import { db } from "@src/config/db.config";
import type { CreateJobInput, JobDataSchemaType } from "@src/modules/job/job.schema";

export const buildJobPayload = (priority: CreateJobInput["priority"]): JobDataSchemaType => ({
    recipient: `${priority}@example.com`,
    title: `${priority.toUpperCase()} priority job`,
    description: `Process the ${priority} priority job and send the follow up email to the target user.`,
});

export type SeedJobOptions = {
    payload: JobDataSchemaType;
    createdBy: string;
    priority?: number;
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
    priority = 2, // Default to medium
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
                priority,
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
                $6,
                COALESCE($7::timestamptz, NOW()),
                COALESCE($7::timestamptz, NOW()),
                $8,
                $9
            )
            RETURNING *
        `,
        [payload, createdBy, priority, status, attempts, maxAttempts, createdAt ?? null, assignedWorkerId, lockedAt]
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
