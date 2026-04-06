import { z } from "zod";
import { ERROR_CODES } from "@src/types/error.types";
import { AppError } from "./error";

export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = z.flattenError(result.error);
        throw new AppError("Validation failed", 400, {
            code: ERROR_CODES.VALIDATION_ERROR,
            fields: errors.fieldErrors,
        });
    }

    return result.data;
};
