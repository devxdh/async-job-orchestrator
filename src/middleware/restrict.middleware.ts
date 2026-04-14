import type { RequestHandler } from "express";
import { ERROR_CODES } from "@src/types/error.types";
import { AppError } from "@src/utils/error";

/**
 * This is our "Role Bouncer."
 * 
 * I designed it as a factory function. It takes in the roles that ARE 
 * allowed to access a route (like ['admin']) and returns a middleware 
 * that checks if the current user has that role.
 * 
 * If a worker tries to access an admin route, we stop them here and 
 * send a 403 Forbidden status.
 */
export const restrictMiddleware = (...allowedRoles: string[]): RequestHandler => {
    return (req, res, next) => {
        // We first make sure the user is actually logged in 
        // (the authMiddleware should have already tagged the request).
        if (!req.user) {
            throw new AppError("User not logged in", 400, {
                code: ERROR_CODES.AUTHENTICATION_REQUIRED,
            });
        }

        // Now we check if their role is in the 'allowed' list.
        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError("You do not have required permission for this action", 403, {
                code: ERROR_CODES.FORBIDDEN_ACCESS,
            });
        }

        // If it's all good, they're allowed through!
        next();
    }
};
