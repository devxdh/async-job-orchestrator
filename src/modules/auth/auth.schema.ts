import { z } from "zod";

// Nothing new or unusual going on here!
export const userSchema = z.object({
    email: z.email({
        error: issue => !issue.input ? "Email is required" : "Invalid email address"
    }),
    password: z.string({
        error: issue => !issue.input ? "Password is required" : "Invalid password"
    })
        .min(8, { error: "Password must be at least 8 characters" }),
    // Only allow two values either "worker" or "admin"
    role: z.enum(["worker", "admin"], {
        error: issue => !issue.input ? "Role is required" : "Role must either be 'worker' or 'admin'"
    })
});

export const loginUserSchema = userSchema.omit({ role: true });

export type UserSchemaType = z.infer<typeof userSchema>;
export type loginUserSchemaType = z.infer<typeof loginUserSchema>;