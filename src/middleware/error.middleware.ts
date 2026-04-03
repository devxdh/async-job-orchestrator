import type { ErrorRequestHandler } from "express";
import AppError from "../utils/AppError.js";

export const errorMiddleware: ErrorRequestHandler = async (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong!";
    let errorCode = err.code || "INTERNAL_ERROR";
    let success = false;

    if (!(err instanceof AppError)) {
        if (err.type === "entity.parse.failed") {
            message = "Invalid JSON format";
            errorCode = "INVALID_JSON";
            statusCode = 400;
        }
    }

    console.error("Error Handler: ", { code: errorCode, message, stack: err.stack });

    res.status(statusCode).json({
        success,
        error: {
            code: errorCode,
            message,
        }
    })
};