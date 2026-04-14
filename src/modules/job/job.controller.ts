import type { Request, Response } from "express";
import { validate } from "@src/utils/validate";
import { sendSuccess } from "@src/utils/helpers";
import { createJobSchema, listJobSchema, reportJobSchema } from "./job.schema";
import * as jobService from "./job.service";

/**
 * Admins call this to create a new job. 
 * I use my 'validate' helper here to make sure the input matches our schema.
 */
export const create = async (req: Request, res: Response) => {
    const adminId = req.user?.id!;
    const validatedInput = validate(createJobSchema, req.body);
    const data = await jobService.createJob(adminId, validatedInput);
    return sendSuccess(res, data, 201);
};

/**
 * Workers call this to claim the next available job.
 */
export const getNext = async (req: Request, res: Response) => {
    const workerId = req.user?.id!;
    const data = await jobService.getNextJob(workerId);
    
    // If there's nothing for them to do, we let them know politely.
    if (!data) {
        return sendSuccess(res, null, 200, {
            message: "There are no available jobs at the moment!",
        });
    }

    return sendSuccess(res, data, 200);
};

/**
 * When a worker is finished, they post their results here.
 */
export const reportJob = async (req: Request, res: Response) => {
    const jobId = req.params.id as string;
    const workerId = req.user?.id!;
    const validatedInput = validate(reportJobSchema, req.body);
    const data = await jobService.reportJobOutcome(workerId, jobId, validatedInput);
    return sendSuccess(res, data, 200);
};

/**
 * Admins use this to see what's happening in the system. 
 * We support filtering by status and limit/cursor based pagination.
 */
export const list = async (req: Request, res: Response) => {
    const validatedInput = validate(listJobSchema, req.query);
    const { jobs, nextCursor } = await jobService.listJobs(validatedInput)

    return sendSuccess(res, jobs, 200, {
        pagination: {
            nextCursor,
            hasMore: !!nextCursor
        },
    });
};
