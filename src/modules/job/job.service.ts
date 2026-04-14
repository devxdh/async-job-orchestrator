import { db } from "@src/config/db.config";
import { ERROR_CODES } from "@src/types/error.types";
import { AppError } from "@src/utils/error";
import { JobQueries } from "./job.queries";
import type { CreateJobInput, ListJobSchemaType, ReportJobSchemaType } from "./job.schema";

/**
 * This is our priority map. I'm using numbers in the database because 
 * sorting SMALLINT is way faster than strings for the DB engine!
 * 
 * 1:High, 2:Medium, 3:Low.
 */
const PRIORITY_MAP: Record<string, number> = { high: 1, medium: 2, low: 3 };

/**
 * Creates a new job. We're an admin, so we can set the priority.
 * 
 * @param adminId - The UUID of the admin who's making the job.
 * @param input - The validated job data (payload + priority).
 */
export const createJob = async (adminId: string, input: CreateJobInput) => {
    const priorityInt = PRIORITY_MAP[input.priority];
    const result = await db.query(JobQueries.create, [adminId, input.payload, priorityInt]);
    return result.rows[0];
};

/**
 * A worker calls this to get the next job they should work on. 
 * I designed it to be as fast as possible so our system can scale.
 */
export const getNextJob = async (workerId: string) => {
    const result = await db.query(JobQueries.getNext, [workerId]);
    if (result.rowCount === 0) return null;
    return result.rows[0];
};

/**
 * When a worker is done, they call this. It updates the database with 
 * their status and any errors that happened.
 */
export const reportJobOutcome = async (workerId: string, jobId: string, validatedInput: ReportJobSchemaType) => {
    const { status, last_error } = validatedInput;
    const result = await db.query(JobQueries.reportJob, [status, last_error, jobId, workerId]);

    // If we couldn't find a job assigned to this worker, I'm throwing an error 
    // to be safe!
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

/**
 * This is called by our background system to find "dead" jobs.
 */
export const recoverStuckJob = async () => {
    const result = await db.query(JobQueries.recoverStuckJob)
    return result.rows;
};

/**
 * Fetches the job list for admins with pagination. 
 * If there are more jobs after the current page, we return a 'nextCursor'.
 */
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
