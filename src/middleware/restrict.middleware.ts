import type { RequestHandler } from "express";
import AppError from "../utils/AppError.js";

export const restrictMiddleware = (...allowedRoles: string[]): RequestHandler => {
    return (req, res, next) => {
        if (!req.user) throw new AppError("User not logged in", 400, "AUTHENTICATION_REQUIRED");

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError("You do not have required permission for this action", 403, "FORBIDDEN_ACCESS")
        };
        next();
    }
};