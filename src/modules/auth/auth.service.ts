import { db } from "../../config/db.config.js";
import AppError from "../../utils/AppError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isDatabaseError } from "../../utils/helpers.js";
import type { UserSchemaType, loginUserSchemaType } from "../../zod/schema.js";
import { env } from "../../config/env.config.js";

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
                throw new AppError("User already exists", 409);
        };
        throw err; // Re-throws the error for error middleware to handle it
    }
}

export const loginUser = async (data: loginUserSchemaType) => {
    const { email, password } = data;

    // Fetches user data from Database 
    const result = await db.query(`SELECT id, password, role FROM users WHERE email=$1`, [email]);
    const user = result.rows[0];

    // Throws custom error if either of them is false 
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError("Invalid email or password", 401)
    }

    // Generates a jwt token and returns it
    const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' })
    return token;
}

export const removeUser = async (id: string) => {
    // Searchs for the user by id -> deletes the user -> returns the row deleted
    const result = await db.query(`DELETE FROM users WHERE id=$1 RETURNING id, email, role`, [id])
    return result.rows[0];
};