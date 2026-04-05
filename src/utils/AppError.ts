import { ERROR_CODES } from "@src/types/error.types";
import type { AppErrorOptions, ErrorCode, ErrorStatus, ValidationFields } from "@src/types/error.types";

export default class AppError extends Error {
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
}
