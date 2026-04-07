import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@src/app";
import { cleanupDB } from "@tests/setup/db";
import { seedUser } from "@tests/setup/helpers/auth.helper";

const testWorker = {
    email: "login_worker@app.test",
    password: "password123"
}

describe("POST /auth/login", () => {
    beforeEach(async () => {
        await cleanupDB();

        await seedUser({
            email: "login_worker@app.test",
            password: "password123",
            role: "worker"
        })
    })

    it("should return status-code 200 and a JWT token for valid credentials", async () => {
        const res = await request(app)
            .post('/auth/login')
            .send(testWorker)

        expect(res.status).toBe(200)
        expect(res.body.status).toBe('success')
        expect(res.body.data).toHaveProperty('token')
        expect(res.body.data.token).toBeTypeOf('string')
        expect(res.body.data).not.toHaveProperty('password')
    })

    it("should return status-code 401 for invalid login password and error", async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ ...testWorker, password: 'incorrect_password123' })

        expect(res.status).toBe(401)
        expect(res.body).toMatchObject({
            status: 'fail',
            error: {
                code: "INVALID_CREDENTIALS",
                message: "Invalid email or password"
            },
            data: null
        })
    })

    it.each([
        {
            name: 'invalid email',
            payload: { ...testWorker, email: 'not-an-email' },
            fieldError: { email: ['Invalid email address'] }
        },
        {
            name: 'short password',
            payload: { ...testWorker, password: '123' },
            fieldError: { password: ['Password must be at least 8 characters'] }
        },
        {
            name: 'missing fields',
            payload: {},
            fieldError: { email: ["Email is required"], password: ["Password is required"] }
        },
    ])('should return 400 for $name and error', async ({ payload, fieldError }) => {
        const res = await request(app)
            .post('/auth/login')
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
            status: "fail",
            error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                fields: fieldError
            },
            data: null
        })
    });
});