import type { Request, Response } from "express";
import { jobPayload, listJobSchema, reportJobSchema } from "./job.schema.js";
import { validate } from "../../utils/validate.js";
import * as jobService from "./job.service.js";

export const create = async (req: Request, res: Response) => {
    const adminId = req.user?.id!;
    const payload = validate(jobPayload, req.body)
    const data = await jobService.createJob(adminId, payload)
    res.status(201).json({ status: 'success', data })
};

export const getNext = async (req: Request, res: Response) => {
    const workerId = req.user?.id!;
    const data = await jobService.getNextJob(workerId);
    if (!data) {
        return res.status(200).json({
            status: 'success',
            message: "There are no available jobs at the moment!",
            data: null
        });
    }
    res.status(200).json({ status: 'success', data });
};

export const reportJob = async (req: Request, res: Response) => {
    const jobId = req.params.id as string;
    const workerId = req.user?.id!;
    const validatedInput = validate(reportJobSchema, req.body);
    const data = await jobService.reportJobOutcome(workerId, jobId, validatedInput);
    res.status(200).json({ status: 'success', data })
};

export const list = async (req: Request, res: Response) => {
    const adminId = req.user?.id!;
    const validatedInput = validate(listJobSchema, req.query);
    const { jobs, nextCursor } = await jobService.listJobs(validatedInput)

    res.status(200).json({
        status: 'success',
        data: jobs,
        pagination: {
            nextCursor,
            hasMore: !!nextCursor
        }
    });
};