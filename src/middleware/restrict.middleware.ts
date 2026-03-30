import type { RequestHandler } from "express";
import AppError from "../utils/AppError.js";

/**
 * @param allowedRoles - A list of roles permitted (e.g -> 'admin' or 'worker')
 * @returns - returns a middleware function that checks the req.user.role
 * It's only for development ease and it has no impact on our app
 */

export const restrictMiddleware = (...allowedRoles: string[]): RequestHandler => {
    return (req, res, next) => {
        if (!req.user) throw new AppError("User not logged in", 400);

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError("You do not have required permission for this action", 403)
        };
        next();
    }
};