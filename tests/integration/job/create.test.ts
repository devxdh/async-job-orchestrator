import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { cleanupDB } from "@tests/setup/db";
import { seedAndAuthorize } from "@tests/setup/helpers/auth.helper";
import type { AuthHeaderType, UserType } from "@tests/setup/helpers/types.helper";
import { app } from "@src/app";
import { buildJobPayload } from "@tests/setup/helpers/job.helper";

const jobPayload = buildJobPayload("high");
const createJobInput = {
    priority: "high",
    payload: jobPayload
};

describe("POST /job/ as admin", () => {
    let authHeader: AuthHeaderType;
    let user: UserType;

    beforeEach(async () => {
        await cleanupDB();
        const { _authHeader, _user } = await seedAndAuthorize({
            email: "create_admin@app.test",
            password: "password123",
            role: 'admin'
        })
        authHeader = _authHeader;
        user = _user;
    })

    it("should return status-code 201 and returns the job details for valid payload", async () => {
        const res = await request(app)
            .post('/job/')
            .send(createJobInput)
            .set(authHeader);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            status: 'success',
            data: {
                payload: jobPayload,
                priority: 1, // mapped from 'high'
                created_by: user.id
            },
            error: null
        });
        expect(res.body.data.id).toEqual(expect.any(String));
        expect(res.body.data.created_at).toEqual(expect.any(String));
    });

    it.each([
        {
            name: "invalid recipient email",
            input: { ...createJobInput, payload: { ...jobPayload, recipient: "not-an-email" } },
            fieldError: { payload: { recipient: ["Invalid email address"] } }
        },
        {
            name: "short title",
            input: { ...createJobInput, payload: { ...jobPayload, title: "Hey" } },
            fieldError: { payload: { title: ["Title must be between 5-50 characters"] } }
        },
        {
            name: "short description",
            input: { ...createJobInput, payload: { ...jobPayload, description: "Too short" } },
            fieldError: { payload: { description: ["Description must be between 20-250 characters"] } }
        },
        {
            name: "invalid priority",
            input: { ...createJobInput, priority: "urgent" },
            fieldError: { priority: ["Invalid priority. Only high, medium and low are valid"] }
        },
        {
            name: "missing payload fields",
            input: { priority: "low", payload: {} },
            fieldError: {
                payload: {
                    recipient: ["Email is required"],
                    title: ["Title is required"],
                    description: ["Description is required"]
                }
            }
        }
    ])("should return 400 for $name", async ({ input, fieldError }) => {
        const res = await request(app)
            .post("/job/")
            .send(input)
            .set(authHeader);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
            status: "fail",
            error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                fields: fieldError
            },
            data: null
        });
    });
});

describe("POST /job/ as worker", () => {
    let authHeader: AuthHeaderType;

    beforeEach(async () => {
        await cleanupDB();
        const { _authHeader } = await seedAndAuthorize({
            email: "create_worker@app.test",
            password: "password123",
            role: "worker"
        });
        authHeader = _authHeader;
    });

    it("should return 403 when worker tries to create a job", async () => {
        const res = await request(app)
            .post("/job/")
            .send(createJobInput)
            .set(authHeader);

        expect(res.status).toBe(403);
        expect(res.body).toMatchObject({
            status: "fail",
            error: {
                code: "FORBIDDEN_ACCESS",
                message: "You do not have required permission for this action"
            },
            data: null
        });
    });

})
