import type { BodyParserError } from "@src/types/error.types";
import { DatabaseError } from "pg";
import { ERROR_CODES } from "@src/types/error.types";
import type { AppErrorOptions, ErrorCode, ErrorStatus, ValidationFields } from "@src/types/error.types";

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

export const isBodyParserError = (err: unknown): err is BodyParserError => {
    return typeof err === "object" && err !== null && "type" in err;
};

// Based on true or false, function determines if the err is a database error or not
export function isDatabaseError(err: unknown): err is DatabaseError {
    /*
     Unique Constraint Violation -> a database error
     Email column is unique -> email already exists
    */
    return err instanceof DatabaseError && 'code' in err; // returns true or false;
}

export const normalizeError = (err: unknown): AppError => {
    if (err instanceof AppError) {
        return err;
    }

    if (isBodyParserError(err) && err.type === "entity.parse.failed") {
        return new AppError("Invalid JSON format", 400, { code: ERROR_CODES.INVALID_JSON });
    }

    return new AppError("Something went wrong", 500, {
        code: ERROR_CODES.INTERNAL_ERROR,
    });
};