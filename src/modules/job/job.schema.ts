import { z } from "zod";

// Payload is job data.
export const jobPayload = z.object({
    recipient: z.email({ message: "Invalid email address!" }),
    title: z.string().min(5).max(50, { message: "title must be between 5-50 characters!" }),
    description: z.string().min(20).max(250, { message: "description must be between 20-250 characters!" }),
    priority: z.enum(["low", "medium", "high"])
})

// Worker processes the job and then notifies the db about it's status
export const reportJobSchema = z.object({
    status: z.enum(['success', 'failed']),
    last_error: z.string().optional()
})

export const listJobSchema = z.object({
    status: z.enum(['success', 'failed', 'pending', 'processing']).nullable().optional(),
    cursor: z.string().nullable().optional(),
    limit: z.coerce.number().min(1).max(100, { message: "Limit should be between 1-100" }).default(10)
})

export type JobPayloadType = z.infer<typeof jobPayload>;
export type ReportJobSchemaType = z.infer<typeof reportJobSchema>;
export type ListJobSchemaType = z.infer<typeof listJobSchema>;