import { z } from "zod";
import { ERROR_CODES } from "@src/types/error.types";
import { AppError } from "./error";

/**
 * This is my custom validation helper. I built it this way because I wanted 
 * our API to return errors that look exactly like the data we sent in.
 * 
 * Instead of a flat list, it creates a "nested" object. So if 'payload.email' 
 * fails, the frontend gets an error object at '{ payload: { email: [...] } }'.
 * This makes it way easier for someone building a form to show the right error!
 */
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const fieldErrors: Record<string | number, any> = {};
        
        // I'm looping through all the issues Zod found and building our 
        // nested error tree bit by bit.
        result.error.issues.forEach((issue) => {
            let current = fieldErrors;
            const path = issue.path;
            
            for (let i = 0; i < path.length; i++) {
                const part = path[i];
                if (part === undefined || typeof part === 'symbol') continue;

                const isLast = i === path.length - 1;

                if (isLast) {
                    // We've reached the actual field that failed.
                    if (!current[part]) {
                        current[part] = [];
                    }
                    if (Array.isArray(current[part])) {
                        current[part].push(issue.message);
                    }
                } else {
                    // We're still digging deeper into the nested object.
                    if (!current[part]) {
                        current[part] = {};
                    }
                    
                    // If we find a field that was supposed to be a value but is 
                    // actually a parent, we move the errors into a special key.
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
