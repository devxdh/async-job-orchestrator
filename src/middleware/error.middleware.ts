import type { ErrorRequestHandler } from "express";
import { normalizeError } from "@src/utils/error";

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
