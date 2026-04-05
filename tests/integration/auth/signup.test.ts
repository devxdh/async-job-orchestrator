import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@src/app";
import { cleanupDB } from "@tests/setup/db";

describe('POST /auth/signup', () => {
    beforeEach(async () => {
        await cleanupDB();
    });

    // Ideal case 
    it('should return status-code 201 and user data for valid input', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send({
                email: "worker1@test.com",
                password: "password123",
                role: "worker"
            })

        expect(res.status).toBe(201);
        expect(res.body.data).not.toHaveProperty('password');
        expect(res.body).toMatchObject({
            status: 'success',
            data: {
                email: "worker1@test.com",
                role: "worker"
            },
            error: null
        })
    })

    // Duplicate user case 
    it('should return status-code 409 and error in response for duplicate users', async () => {
        await request(app)
            .post('/auth/signup')
            .send({
                email: "worker1@test.com",
                password: "password123",
                role: "worker"
            });

        const res = await request(app)
            .post('/auth/signup')
            .send({
                email: "worker1@test.com",
                password: "password123",
                role: "worker"
            });

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

    // Invalid Input cases
    it.each([
        {
            name: 'invalid email',
            payload: { email: 'not-an-email', password: 'password123', role: 'worker' },
            fieldError: { email: ['Invalid email address'] }
        },
        {
            name: 'short password',
            payload: { email: 'test@test.com', password: '123', role: 'worker' },
            fieldError: { password: ['Password must be at least 8 characters'] }
        },
        {
            name: 'invalid role',
            payload: { email: 'test@test.com', password: 'password123', role: 'manager' },
            fieldError: { role: ["Role must either be 'worker' or 'admin'"] }
        },
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