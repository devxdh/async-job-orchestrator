import { db } from "@src/config/db.config";
import { ERROR_CODES } from "@src/types/error.types";
import { AppError } from "@src/utils/error";
import { JobQueries } from "./job.queries";
import type { JobPayloadType, ListJobSchemaType, ReportJobSchemaType } from "./job.schema";

export const createJob = async (adminId: string, payload: JobPayloadType) => {
    const result = await db.query(JobQueries.create, [adminId, payload])
    return result.rows[0];
};

export const getNextJob = async (workerId: string) => {
    const result = await db.query(JobQueries.getNext, [workerId]);
    if (result.rowCount === 0) return null;
    return result.rows[0];
};

export const reportJobOutcome = async (workerId: string, jobId: string, validatedInput: ReportJobSchemaType) => {
    const { status, last_error } = validatedInput;
    const result = await db.query(JobQueries.reportJob, [status, last_error, jobId, workerId]);

    if (result.rowCount === 0) {
        throw new AppError(
            "Could not update job. Either it doesn't exist, isn't assigned to you, or is no longer 'processing'",
            400,
            {
                code: ERROR_CODES.JOB_UPDATE_FAILED,
            }
        );
    }

    return result.rows[0];
};

export const recoverStuckJob = async () => {
    const result = await db.query(JobQueries.recoverStuckJob)
    return result.rows;
};

export const listJobs = async (validatedInput: ListJobSchemaType) => {
    const { status, cursor, limit } = validatedInput;

    const result = await db.query(JobQueries.listJob, [status || null, cursor || null, limit])

    const jobs = result.rows;

    let nextCursor = null;
    if (jobs.length === limit) {
        nextCursor = jobs[jobs.length - 1].created_at;
    };

    return {
        jobs,
        nextCursor
    };
};
