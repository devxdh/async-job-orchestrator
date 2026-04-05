import { DatabaseError } from "pg";
import type { Response } from "express";
import type { ApiResponse, PaginationMeta } from "@src/types/api.types";
import type { BodyParserError } from "@src/types/error.types";

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
