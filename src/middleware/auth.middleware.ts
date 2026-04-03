import { env } from "../config/env.config.js";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import type { MyToken } from "../types/commonTypes.js";

export const authMiddleware: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError("Please login to access this route!", 401);
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
        throw new AppError("Invalid or expired session. Please login again.", 401);
    }
};