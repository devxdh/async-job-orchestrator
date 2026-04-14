import { env } from "@src/config/env.config";
import { db } from "@src/config/db.config";
import { ERROR_CODES } from "@src/types/error.types";
import { AppError, isDatabaseError } from "@src/utils/error";
import { logger } from "@src/utils/logger";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { UserSchemaType, loginUserSchemaType } from "./auth.schema";

/**
 * Creates a new user (Worker or Admin).
 * 
 * I'm using bcrypt to hash passwords so we never store them in plain text.
 * If a user tries to sign up with an email that already exists, 
 * I catch the Postgres 'Unique Violation' error (23505) and 
 * throw a nice error message instead of a database crash!
 */
export const createUser = async (data: UserSchemaType) => {
    try {
        const { email, password, role } = data;
        const hashed_password = await bcrypt.hash(password, 10)

        const result = await db.query(
            `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role`,
            [email, hashed_password, role]
        )
        
        const newUser = result.rows[0];
        
        // Milestone: Record that a new user has joined the system.
        logger.info({ userId: newUser.id, role: newUser.role }, "New user signed up successfully.");
        
        return newUser;
    } catch (err) {
        if (isDatabaseError(err)) {
            if (err.code === '23505') {
                logger.warn({ email: data.email }, "Signup failed: Email already exists.");
                throw new AppError("User already exists", 409, {
                    code: ERROR_CODES.USER_EXISTS,
                });
            }
        }

        throw err;
    }
};

/**
 * Logs in a user and returns a JWT token.
 * 
 * This is our "Key Maker." It checks the credentials and, if they're right, 
 * signs a token that the user can use to prove who they are 
 * for the next 1 hour.
 */
export const loginUser = async (data: loginUserSchemaType) => {
    const { email, password } = data;

    const result = await db.query(`SELECT id, password, role FROM users WHERE email=$1`, [email]);
    const user = result.rows[0];

    // We verify the password hash using bcrypt.compare.
    if (!user || !(await bcrypt.compare(password, user.password))) {
        logger.warn({ email }, "Login failed: Invalid credentials.");
        throw new AppError("Invalid email or password", 401, {
            code: ERROR_CODES.INVALID_CREDENTIALS,
        });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' })
    
    // Milestone: Record a successful login.
    logger.info({ userId: user.id, role: user.role }, "User logged in successfully.");
    
    return token;
};

/**
 * Removes a user from the system.
 */
export const removeUser = async (id: string) => {
    const result = await db.query(`DELETE FROM users WHERE id=$1 RETURNING id, email, role`, [id])
    
    if (!result.rows[0]) {
        throw new AppError("User not found", 404, {
            code: ERROR_CODES.USER_NOT_FOUND,
        });
    }

    const deletedUser = result.rows[0];
    
    // Milestone: Record that a user was deleted.
    logger.info({ userId: deletedUser.id, email: deletedUser.email }, "User account deleted.");

    return deletedUser;
};
