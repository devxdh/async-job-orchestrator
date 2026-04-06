import type { Response } from "express";
import type { ApiResponse, PaginationMeta } from "@src/types/api.types";

export const sendSuccess = <T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    options: {
        message?: string;
        pagination?: PaginationMeta;
    } = {}
): Response<ApiResponse<T>> => {
    return res.status(statusCode).json({
        status: "success",
        data,
        error: null,
        ...(options.message ? { message: options.message } : {}),
        ...(options.pagination ? { pagination: options.pagination } : {}),
    });
};
