import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = async (err, req, res, next) => {
    const code = err.statusCode || 500;
    const status = err.status || 'error';

    console.error("ErrorHandler Error", err.message);

    res.status(code).json({
        status,
        message: err.message || "Something went wrong!"
    });
};