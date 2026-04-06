import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@src/app";
import { cleanupDB, seedUser, signJWT, type RoleType } from "@tests/setup/db";
import jwt from "jsonwebtoken";
import { env } from "@src/config/env.config";

type User = {
    id: string;
    email: string;
    role: RoleType;
};

describe("DELETE /auth/remove", () => {
    let token: string;
    let user: User;

    beforeEach(async () => {
        await cleanupDB();

        const res = await seedUser({
            email: "login_worker@app.test",
            password: "password123",
            role: "worker"
        });

        token = signJWT({ id: res.id, role: res.role });
        user = { id: res.id, email: res.email, role: res.role };
    });

    it("should return status-code 200 and id, email and role for authorized users", async () => {
        const res = await request(app)
            .post('/auth/remove')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            status: "success",
            data: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            error: null
        });
        expect(res.body.data).not.toHaveProperty('password');
    });

    it("should return 404 when the authenticated user no longer exists", async () => {
        await request(app)
            .post('/auth/remove')
            .set('Authorization', `Bearer ${token}`);

        const res = await request(app)
            .post('/auth/remove')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
            status: "fail",
            error: {
                code: "USER_NOT_FOUND",
                message: "User not found"
            },
            data: null
        });
    });

    it("should return 401 for an invalid jwt token", async () => {
        const res = await request(app)
            .post('/auth/remove')
            .set('Authorization', 'Bearer invalid.jwt.token');

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({
            status: "fail",
            error: {
                code: "INVALID_SESSION",
                message: "Invalid or expired session. Please login again."
            },
            data: null
        });
    });

    it("should return 401 for an expired jwt token", async () => {
        const expiredToken = jwt.sign(
            { id: user.id, role: user.role },
            env.JWT_SECRET,
            { expiresIn: -1 }
        );

        const res = await request(app)
            .post('/auth/remove')
            .set('Authorization', `Bearer ${expiredToken}`);

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({
            status: "fail",
            error: {
                code: "INVALID_SESSION",
                message: "Invalid or expired session. Please login again."
            },
            data: null
        });
    });
});