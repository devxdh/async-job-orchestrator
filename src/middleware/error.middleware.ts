import type { ErrorRequestHandler } from "express";
import { ERROR_CODES, } from "@src/types/error.types";
import AppError from "@src/utils/AppError";
import { isBodyParserError } from "@src/utils/helpers";

const normalizeError = (err: unknown): AppError => {
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

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    const error = normalizeError(err);

    console.error("Error:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
    });

    res.status(error.statusCode).json({
        status: error.status,
        error: {
            code: error.code,
            message: error.message,
            ...(error.fields ? { fields: error.fields } : {}),
        },
        data: null,
    });
};
