import { env } from "@src/config/env.config";
import { ERROR_CODES } from "@src/types/error.types";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@src/utils/error";
import type { MyToken } from "@src/types/auth.types";

/**
 * This is our "Passport Control."
 * 
 * Every request to a protected route has to go through here first. 
 * I'm checking the 'Authorization' header for a Bearer token (JWT). 
 * 
 * If the token is valid, I attach the user's ID and Role to the request 
 * so the next functions in the line know exactly who's calling!
 */
export const authMiddleware: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // First, I check if the token is even there.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError("Please login to access this route!", 401, {
            code: ERROR_CODES.AUTHENTICATION_REQUIRED,
        });
    }

    const token = authHeader.split(" ")[1] as string;

    try {
        // Then, I verify the JWT using our secret key.
        const decoded = jwt.verify(token, env.JWT_SECRET) as MyToken;

        // If it's all good, I "tag" the request with the user info.
        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();
    } catch (err) {
        // If the token was fake or expired, we catch the error here.
        throw new AppError("Invalid or expired session. Please login again.", 401, {
            code: ERROR_CODES.INVALID_SESSION,
        });
    }
};
