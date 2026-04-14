import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@src/app";
import { cleanupDB } from "@tests/setup/db";
import { seedAndAuthorize } from "@tests/setup/helpers/auth.helper";
import type { AuthHeaderType, UserType } from "@tests/setup/helpers/types.helper";
import { buildJobPayload, getJobById, seedJob } from "@tests/setup/helpers/job.helper";

describe("GET /job/next as worker", () => {
    let authHeader: AuthHeaderType;
    let worker: UserType;
    let admin: UserType;

    beforeEach(async () => {
        await cleanupDB();

        const { _authHeader, _user } = await seedAndAuthorize({
            email: "getnext_worker@app.test",
            password: "password123",
            role: "worker"
        });

        const { _user: adminUser } = await seedAndAuthorize({
            email: "getnext_admin@app.test",
            password: "password123",
            role: "admin"
        });

        authHeader = _authHeader;
        worker = _user;
        admin = adminUser;
    });

    it("should return 200 with null data when there are no available jobs", async () => {
        const res = await request(app)
            .get("/job/next")
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            status: "success",
            data: null,
            error: null,
            message: "There are no available jobs at the moment!"
        });
    });

    it("should return the next pending job and mark it as processing", async () => {
        const pendingJob = await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1
        });

        const res = await request(app)
            .get("/job/next")
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            status: "success",
            data: {
                id: pendingJob.id,
                payload: pendingJob.payload,
                status: "processing"
            },
            error: null
        });
        expect(res.body.data.locked_at).toEqual(expect.any(String));

        const updatedJob = await getJobById(pendingJob.id);

        expect(updatedJob).toMatchObject({
            status: "processing",
            assigned_worker_id: worker.id
        });
        expect(updatedJob?.locked_at).toBeTruthy();
    });

    it("should return the highest priority pending job first", async () => {
        const lowJob = await seedJob({
            payload: buildJobPayload("low"),
            createdBy: admin.id,
            priority: 3,
            createdAt: "2026-01-01T10:00:00.000Z"
        });

        await seedJob({
            payload: buildJobPayload("medium"),
            createdBy: admin.id,
            priority: 2,
            createdAt: "2026-01-01T09:00:00.000Z"
        });

        const highJob = await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1,
            createdAt: "2026-01-01T08:00:00.000Z"
        });

        const res = await request(app)
            .get("/job/next")
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            id: highJob.id,
            payload: highJob.payload,
            status: "processing"
        });
        expect(res.body.data.id).not.toBe(lowJob.id);
    });

    it("should return the oldest job when pending jobs have the same priority", async () => {
        const olderHighJob = await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1,
            createdAt: "2026-01-01T08:00:00.000Z"
        });

        await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1,
            createdAt: "2026-01-01T09:00:00.000Z"
        });

        const res = await request(app)
            .get("/job/next")
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            id: olderHighJob.id,
            payload: olderHighJob.payload,
            status: "processing"
        });
    });

    it("should skip pending jobs that already reached max attempts", async () => {
        await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1,
            attempts: 3,
            maxAttempts: 3,
            createdAt: "2026-01-01T08:00:00.000Z"
        });

        const availableJob = await seedJob({
            payload: buildJobPayload("medium"),
            createdBy: admin.id,
            priority: 2,
            createdAt: "2026-01-01T09:00:00.000Z"
        });

        const res = await request(app)
            .get("/job/next")
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            id: availableJob.id,
            payload: availableJob.payload,
            status: "processing"
        });
    });

    it("should skip jobs that are not pending", async () => {
        await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            priority: 1,
            status: "processing",
            assignedWorkerId: worker.id,
            lockedAt: "2026-01-01T08:05:00.000Z",
            createdAt: "2026-01-01T08:00:00.000Z"
        });

        const pendingJob = await seedJob({
            payload: buildJobPayload("low"),
            createdBy: admin.id,
            priority: 3,
            createdAt: "2026-01-01T09:00:00.000Z"
        });

        const res = await request(app)
            .get("/job/next")
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            id: pendingJob.id,
            payload: pendingJob.payload,
            status: "processing"
        });
    });
});

describe("GET /job/next as admin", () => {
    let authHeader: AuthHeaderType;

    beforeEach(async () => {
        await cleanupDB();

        const { _authHeader } = await seedAndAuthorize({
            email: "getnext_admin_only@app.test",
            password: "password123",
            role: "admin"
        });

        authHeader = _authHeader;
    });

    it("should return 403 when admin tries to get the next job", async () => {
        const res = await request(app)
            .get("/job/next")
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
