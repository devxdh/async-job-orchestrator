import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "@src/config/env.config";
import { db } from "@src/config/db.config";
import type { RoleType } from "./types.helper";


type SeedUserType = {
    email: string;
    password: string;
    role: RoleType;
}

type signJWTType = {
    id: string;
    role: RoleType;
}

export const seedUser = async ({ email, password, role }: SeedUserType) => {
    const hashed_password = await bcrypt.hash(password, 10)
    const result = await db.query(
        `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role`,
        [email, hashed_password, role]
    )

    return result.rows[0];
}

export const signJWT = ({ id, role }: signJWTType) => {
    return jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: '1h' });
}

export const seedAndAuthorize = async (userCredentials: SeedUserType) => {
    const user = await seedUser(userCredentials);
    const token = signJWT({ id: user.id, role: user.role });

    return {
        _authHeader: { Authorization: `Bearer ${token}` },
        _user: user
    };
}