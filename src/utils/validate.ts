import { z } from "zod";
import AppError from "./AppError.js";

export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = z.treeifyError(result.error)
        throw new AppError(JSON.stringify(errors), 400, "VALIDATION_ERROR");
    };

    return result.data;
}