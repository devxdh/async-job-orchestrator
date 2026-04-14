import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@src/app";
import { cleanupDB } from "@tests/setup/db";
import { seedAndAuthorize } from "@tests/setup/helpers/auth.helper";
import { buildJobPayload, seedJob } from "@tests/setup/helpers/job.helper";
import type { AuthHeaderType, UserType } from "@tests/setup/helpers/types.helper";

describe("GET /job as admin", () => {
    let authHeader: AuthHeaderType;
    let admin: UserType;

    beforeEach(async () => {
        await cleanupDB();

        const { _authHeader, _user } = await seedAndAuthorize({
            email: "list_admin@app.test",
            password: "password123",
            role: "admin"
        });

        authHeader = _authHeader;
        admin = _user;
    });

    it("should return jobs ordered by created_at descending with default pagination", async () => {
        const oldestJob = await seedJob({
            payload: buildJobPayload("low"),
            createdBy: admin.id,
            priority: 3,
            createdAt: "2026-01-01T08:00:00.000Z"
        });

        await seedJob({
            payload: buildJobPayload("medium"),
            createdBy: admin.id,
            priority: 2,
            createdAt: "2026-01-01T09:00:00.000Z"
        });

        const newestJob = await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1,
            createdAt: "2026-01-01T10:00:00.000Z"
        });

        const res = await request(app)
            .get("/job")
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.error).toBeNull();
        expect(res.body.pagination).toEqual({
            nextCursor: null,
            hasMore: false
        });
        expect(res.body.data).toHaveLength(3);
        expect(res.body.data.map((job: { id: string }) => job.id)).toEqual([
            newestJob.id,
            expect.any(String),
            oldestJob.id
        ]);
        expect(res.body.data[0]).toMatchObject({
            id: newestJob.id,
            payload: newestJob.payload
        });
        expect(res.body.data[2]).toMatchObject({
            id: oldestJob.id,
            payload: oldestJob.payload
        });
    });

    it("should filter jobs by status", async () => {
        const processingJob = await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1,
            status: "processing",
            createdAt: "2026-01-01T10:00:00.000Z"
        });

        await seedJob({
            payload: buildJobPayload("low"),
            createdBy: admin.id,
            priority: 3,
            status: "success",
            createdAt: "2026-01-01T09:00:00.000Z"
        });

        const res = await request(app)
            .get("/job")
            .query({ status: "processing" })
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body.pagination).toEqual({
            nextCursor: null,
            hasMore: false
        });
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toMatchObject({
            id: processingJob.id,
            status: "processing",
            payload: processingJob.payload
        });
    });

    it("should paginate jobs using limit and cursor", async () => {
        const oldestJob = await seedJob({
            payload: buildJobPayload("low"),
            createdBy: admin.id,
            priority: 3,
            createdAt: "2026-01-01T08:00:00.000Z"
        });

        await seedJob({
            payload: buildJobPayload("medium"),
            createdBy: admin.id,
            priority: 2,
            createdAt: "2026-01-01T09:00:00.000Z"
        });

        const newestJob = await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1,
            createdAt: "2026-01-01T10:00:00.000Z"
        });

        const firstPage = await request(app)
            .get("/job")
            .query({ limit: 2 })
            .set(authHeader);

        expect(firstPage.status).toBe(200);
        expect(firstPage.body.data).toHaveLength(2);
        expect(firstPage.body.data.map((job: { id: string }) => job.id)).toEqual([
            newestJob.id,
            expect.any(String)
        ]);
        expect(firstPage.body.pagination.hasMore).toBe(true);
        expect(firstPage.body.pagination.nextCursor).toEqual(expect.any(String));

        const secondPage = await request(app)
            .get("/job")
            .query({
                limit: 2,
                cursor: firstPage.body.pagination.nextCursor
            })
            .set(authHeader);

        expect(secondPage.status).toBe(200);
        expect(secondPage.body.data).toHaveLength(1);
        expect(secondPage.body.data[0]).toMatchObject({
            id: oldestJob.id,
            payload: oldestJob.payload
        });
        expect(secondPage.body.pagination).toEqual({
            nextCursor: null,
            hasMore: false
        });
    });

    it.each([
        {
            name: "invalid status",
            query: { status: "queued" },
            fieldError: { status: ["Invalid option: expected one of \"success\"|\"failed\"|\"pending\"|\"processing\""] }
        },
        {
            name: "invalid cursor",
            query: { cursor: "not-a-date" },
            fieldError: { cursor: ["Cursor must be a valid datetime"] }
        },
        {
            name: "invalid limit",
            query: { limit: 101 },
            fieldError: { limit: ["Limit must be between 1-100"] }
        }
    ])("should return 400 for $name", async ({ query, fieldError }) => {
        const res = await request(app)
            .get("/job")
            .query(query)
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

describe("GET /job as worker", () => {
    let authHeader: AuthHeaderType;

    beforeEach(async () => {
        await cleanupDB();

        const { _authHeader } = await seedAndAuthorize({
            email: "list_worker@app.test",
            password: "password123",
            role: "worker"
        });

        authHeader = _authHeader;
    });

    it("should return 403 when worker tries to list jobs", async () => {
        const res = await request(app)
            .get("/job")
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
});
