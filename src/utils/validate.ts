import { z } from "zod";
import { ERROR_CODES } from "@src/types/error.types";
import { AppError } from "./error";

export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const fieldErrors: Record<string | number, any> = {};
        
        result.error.issues.forEach((issue) => {
            let current = fieldErrors;
            const path = issue.path;
            
            for (let i = 0; i < path.length; i++) {
                const part = path[i];
                if (part === undefined || typeof part === 'symbol') continue;

                const isLast = i === path.length - 1;

                if (isLast) {
                    if (!current[part]) {
                        current[part] = [];
                    }
                    if (Array.isArray(current[part])) {
                        current[part].push(issue.message);
                    }
                } else {
                    if (!current[part]) {
                        current[part] = {};
                    }
                    
                    if (Array.isArray(current[part])) {
                        current[part] = { _errors: current[part] };
                    }
                    current = current[part];
                }
            }
        });

        throw new AppError("Validation failed", 400, {
            code: ERROR_CODES.VALIDATION_ERROR,
            fields: fieldErrors,
        });
    }

    return result.data;
};
