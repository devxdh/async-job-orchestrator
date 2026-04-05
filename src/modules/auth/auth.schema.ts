import { z } from "zod";

// Nothing new or unusual going on here!
export const userSchema = z.object({
    email: z.email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    // Only allow two values either "worker" or "admin"
    role: z.enum(["worker", "admin"], { error: "Role must either be 'worker' or 'admin'" })
});

export const loginUserSchema = userSchema.omit({ role: true });

export type UserSchemaType = z.infer<typeof userSchema>;
export type loginUserSchemaType = z.infer<typeof loginUserSchema>;