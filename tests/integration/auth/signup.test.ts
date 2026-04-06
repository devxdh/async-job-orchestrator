import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@src/app";
import { cleanupDB } from "@tests/setup/db";

const testWorker = {
    email: "new.worker@app.test",
    password: "password123",
    role: "worker"
}

describe('POST /auth/signup', () => {
    beforeEach(async () => {
        await cleanupDB();
    });

    // Ideal case 
    it('should return status-code 201 and user data for valid input', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send(testWorker)

        expect(res.status).toBe(201);
        expect(res.body.data).not.toHaveProperty('password');
        expect(res.body).toMatchObject({
            status: 'success',
            data: {
                email: "new.worker@app.test",
                role: "worker"
            },
            error: null
        })
    })

    // Duplicate user case 
    it('should return status-code 409 and error in response for duplicate users', async () => {
        await request(app)
            .post('/auth/signup')
            .send(testWorker);

        const res = await request(app)
            .post('/auth/signup')
            .send(testWorker);

        expect(res.status).toBe(409)
        expect(res.body).toEqual({
            status: 'fail',
            error: {
                code: "USER_EXISTS",
                message: "User already exists"
            },
            data: null
        })
    })

    // Multiple Invalid Input cases
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
            name: 'invalid role',
            payload: { ...testWorker, role: 'manager' },
            fieldError: { role: ["Role must either be 'worker' or 'admin'"] }
        },
        {
            name: 'missing fields',
            payload: { email: 'new.user@app.test' },
            fieldError: { password: ["Password is required"], role: ["Role is required"] }
        }
    ])('should return 400 for $name', async ({ payload, fieldError }) => {
        const res = await request(app)
            .post('/auth/signup')
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