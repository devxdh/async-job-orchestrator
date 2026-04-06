import { env } from "@src/config/env.config";
import { ERROR_CODES } from "@src/types/error.types";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@src/utils/error";
import type { MyToken } from "@src/types/auth.types";

export const authMiddleware: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError("Please login to access this route!", 401, {
            code: ERROR_CODES.AUTHENTICATION_REQUIRED,
        });
    }

    const token = authHeader.split(" ")[1] as string;

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as MyToken;

        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();
    } catch (err) {
        throw new AppError("Invalid or expired session. Please login again.", 401, {
            code: ERROR_CODES.INVALID_SESSION,
        });
    }
};
