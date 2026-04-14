import type { BodyParserError } from "@src/types/error.types";
import { DatabaseError } from "pg";
import { ERROR_CODES } from "@src/types/error.types";
import type { AppErrorOptions, ErrorCode, ErrorStatus, ValidationFields } from "@src/types/error.types";

/**
 * This is our custom 'AppError' class. I built this so we can 
 * throw errors with a specific HTTP status code and an error code.
 * 
 * It helps us keep our error handling consistent across the whole app.
 */
export class AppError extends Error {
    readonly statusCode: number;
    readonly status: ErrorStatus;
    readonly code: ErrorCode;
    readonly fields: ValidationFields | undefined;

    constructor(
        message: string,
        statusCode: number,
        options: AppErrorOptions = {}
    ) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.status = statusCode < 500 ? "fail" : "error";
        this.code = options.code ?? ERROR_CODES.INTERNAL_ERROR;
        this.fields = options.fields;

        Error.captureStackTrace(this, this.constructor);
    }
};

/**
 * These are simple helpers I wrote to check what kind of 
 * error we're dealing with. It's much cleaner than 
 * checking 'if (err.type === ...)' everywhere!
 */
export const isBodyParserError = (err: unknown): err is BodyParserError => {
    return typeof err === "object" && err !== null && "type" in err;
};

// Returns true if the error came from our Postgres database.
export function isDatabaseError(err: unknown): err is DatabaseError {
    return err instanceof DatabaseError && 'code' in err;
}

/**
 * This 'normalizeError' function is our error translator. 
 * 
 * It takes any weird, unknown error and converts it into 
 * our standard 'AppError' format so the rest of our 
 * system can handle it easily.
 */
export const normalizeError = (err: unknown): AppError => {
    if (err instanceof AppError) {
        return err;
    }

    if (isBodyParserError(err) && err.type === "entity.parse.failed") {
        return new AppError("Invalid JSON format", 400, { code: ERROR_CODES.INVALID_JSON });
    }

    // If it's something we didn't plan for, we default to a 500 status.
    return new AppError("Something went wrong", 500, {
        code: ERROR_CODES.INTERNAL_ERROR,
    });
};
