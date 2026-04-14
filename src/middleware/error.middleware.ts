import type { ErrorRequestHandler } from "express";
import { normalizeError } from "@src/utils/error";
import { logger } from "@src/utils/logger";

/**
 * This is our "Safety Net."
 * 
 * In this project, if any route has an error, I don't catch it there. 
 * I let it "bubble up" to this global error handler. 
 * 
 * I'm now using our 'logger' (Pino) to record errors. This is much 
 * better than console.error because it can save logs as searchable 
 * JSON, which is a lifesaver in production!
 */
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    // I normalize the error first so every error has a code and a status.
    const error = normalizeError(err);

    // Recording the error with all its details.
    logger.error({
        code: error.code,
        message: error.message,
        stack: error.stack,
    }, "Global Error Handler Caught Exception");

    // Then we send back a standardized JSON response.
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
