import type { Request, Response } from "express";
import { validate } from "@src/utils/validate";
import { sendSuccess } from "@src/utils/helpers";
import { jobPayload, listJobSchema, reportJobSchema } from "./job.schema";
import * as jobService from "./job.service";

export const create = async (req: Request, res: Response) => {
    const adminId = req.user?.id!;
    const payload = validate(jobPayload, req.body)
    const data = await jobService.createJob(adminId, payload)
    return sendSuccess(res, data, 201);
};

export const getNext = async (req: Request, res: Response) => {
    const workerId = req.user?.id!;
    const data = await jobService.getNextJob(workerId);
    if (!data) {
        return sendSuccess(res, null, 200, {
            message: "There are no available jobs at the moment!",
        });
    }

    return sendSuccess(res, data, 200);
};

export const reportJob = async (req: Request, res: Response) => {
    const jobId = req.params.id as string;
    const workerId = req.user?.id!;
    const validatedInput = validate(reportJobSchema, req.body);
    const data = await jobService.reportJobOutcome(workerId, jobId, validatedInput);
    return sendSuccess(res, data, 200);
};

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
