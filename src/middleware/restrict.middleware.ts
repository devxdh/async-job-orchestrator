import type { RequestHandler } from "express";
import { ERROR_CODES } from "@src/types/error.types";
import AppError from "@src/utils/AppError";

export const restrictMiddleware = (...allowedRoles: string[]): RequestHandler => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError("User not logged in", 400, {
                code: ERROR_CODES.AUTHENTICATION_REQUIRED,
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError("You do not have required permission for this action", 403, {
                code: ERROR_CODES.FORBIDDEN_ACCESS,
            });
        }

        next();
    }
};
