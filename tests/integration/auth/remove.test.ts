import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@src/app";
import { cleanupDB } from "@tests/setup/db";
import { seedAndAuthorize } from "@tests/setup/helpers/auth.helper";
import type { UserType, AuthHeaderType } from "@tests/setup/helpers/types.helper";
import jwt from "jsonwebtoken";
import { env } from "@src/config/env.config";


describe("DELETE /auth/remove", () => {
    let authHeader: AuthHeaderType;
    let user: UserType;

    beforeEach(async () => {
        await cleanupDB();

        const { _authHeader, _user } = await seedAndAuthorize({
            email: "remove_worker@app.test",
            password: "password123",
            role: "worker"
        });

        authHeader = _authHeader;
        user = { ..._user };
    });

    it("should return status-code 200 and id, email and role for authorized users", async () => {
        const res = await request(app)
            .post('/auth/remove')
            .set(authHeader);

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
            .set(authHeader);

        const res = await request(app)
            .post('/auth/remove')
            .set(authHeader);

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