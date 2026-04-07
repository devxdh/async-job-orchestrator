import { z } from "zod";

// Payload is job data.
export const jobPayload = z.object({
    recipient: z.email({
        error: issue => !issue.input ? "Email is required" : "Invalid email address"
    }),

    title: z.string({
        error: issue => !issue.input ? "Title is required" : "Invalid title"
    })
        .min(5, { error: "Title must be between 5-50 characters" })
        .max(50, { error: "Title must be between 5-50 characters" }),

    description: z.string({
        error: issue => !issue.input ? "Description is required" : "Invalid description"
    })
        .min(20, { error: "Description must be between 20-250 characters" })
        .max(250, { error: "Description must be between 20-250 characters" }),

    priority: z.enum(["low", "medium", "high"], {
        error: issue => !issue.input
            ? "Priority is required"
            : "Invalid priority. Only high, medium and low are valid"
    })
});

// Worker processes the job and then notifies the db about it's status
export const reportJobSchema = z.object({
    status: z.enum(['success', 'failed']),
    last_error: z.string().trim().optional()
}).superRefine((input, ctx) => {
    if (input.status === "failed" && !input.last_error) {
        ctx.addIssue({
            code: "custom",
            path: ["last_error"],
            message: "Last error is required when status is failed"
        });
    }
});

export const listJobSchema = z.object({
    status: z.enum(['success', 'failed', 'pending', 'processing']).nullable().optional(),
    cursor: z.string()
        .refine(value => !Number.isNaN(Date.parse(value)), {
            message: "Cursor must be a valid datetime"
        })
        .nullable()
        .optional(),
    limit: z.coerce.number().min(1).max(100, { error: "Limit must be between 1-100" }).default(10)
});

export type JobPayloadType = z.infer<typeof jobPayload>;
export type ReportJobSchemaType = z.infer<typeof reportJobSchema>;
export type ListJobSchemaType = z.infer<typeof listJobSchema>;
