import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@src/config/db.config";
import { ERROR_CODES } from "@src/types/error.types";
import AppError from "@src/utils/AppError";
import { env } from "@src/config/env.config";
import { isDatabaseError } from "@src/utils/helpers";
import type { UserSchemaType, loginUserSchemaType } from "./auth.schema";

export const createUser = async (data: UserSchemaType) => {
    try {
        const { email, password, role } = data;
        // Hashes the password 
        const hashed_password = await bcrypt.hash(password, 10)

        // Query to create a new user in users table
        const result = await db.query(
            `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING email, role`,
            [email, hashed_password, role]
        )
        // Returns new user's email and role 
        return result.rows[0];
    } catch (err) {
        // It avoids making db call to check if email already exists
        if (isDatabaseError(err)) {
            //Unique Violation Error code is a string, trust me :)
            if (err.code === '23505')
                throw new AppError("User already exists", 409, {
                    code: ERROR_CODES.USER_EXISTS,
                });
        }

        throw err; // Re-throws the error for error middleware to handle it
    }
};

export const loginUser = async (data: loginUserSchemaType) => {
    const { email, password } = data;

    // Fetches user data from Database 
    const result = await db.query(`SELECT id, password, role FROM users WHERE email=$1`, [email]);
    const user = result.rows[0];

    // Throws custom error if either of them is false 
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError("Invalid email or password", 401, {
            code: ERROR_CODES.INVALID_CREDENTIALS,
        });
    }

    // Generates a jwt token which have user_id and user_role 
    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' })
    return token;
};

export const removeUser = async (id: string) => {
    // Searchs for the user by id -> deletes the user -> returns the row deleted
    const result = await db.query(`DELETE FROM users WHERE id=$1 RETURNING id, email, role`, [id])
    if (!result.rows[0]) {
        throw new AppError("User not found", 404, {
            code: ERROR_CODES.USER_NOT_FOUND,
        });
    }

    return result.rows[0];
};
