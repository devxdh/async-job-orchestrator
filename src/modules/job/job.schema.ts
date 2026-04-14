import { z } from "zod";

/**
 * These are my job validation schemas. 
 * 
 * I split these up on purpose: 
 * 'jobDataSchema' is just the raw data for the task (like who gets the email).
 * 'createJobSchema' wraps that up with metadata like 'priority'.
 * 
 * This helps us keep the "what to do" separate from the "when to do it."
 */

export const jobDataSchema = z.object({
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
        .max(250, { error: "Description must be between 20-250 characters" })
});

export const createJobSchema = z.object({
    priority: z.enum(["low", "medium", "high"], {
        error: issue => !issue.input
            ? "Priority is required"
            : "Invalid priority. Only high, medium and low are valid"
    }).default("medium"),
    
    // This is the actual job data we'll store in the JSONB column.
    payload: jobDataSchema
});

/**
 * When a worker finishes a job, I want them to tell us if it worked.
 * I added a little logic here so that if they report a failure, 
 * they MUST provide a 'last_error' so we know what went wrong!
 */
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

/**
 * This is for admins who want to see the job list. 
 * I used a cursor-based approach for pagination because it handles 
 * growing lists much better than simple page numbers.
 */
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

export type JobDataSchemaType = z.infer<typeof jobDataSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type ReportJobSchemaType = z.infer<typeof reportJobSchema>;
export type ListJobSchemaType = z.infer<typeof listJobSchema>;
