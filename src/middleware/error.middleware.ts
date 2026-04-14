import type { ErrorRequestHandler } from "express";
import { normalizeError } from "@src/utils/error";

/**
 * This is our "Safety Net."
 * 
 * In this project, if any route has an error, I don't catch it there. 
 * I let it "bubble up" to this global error handler. 
 * 
 * It takes whatever error happened, normalizes it so the response 
 * looks consistent, and logs it so we can debug later. 
 * This keeps our code cleaner and our API responses professional!
 */
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    // I normalize the error first so every error has a code and a status.
    const error = normalizeError(err);

    console.error("Error:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
    });

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
