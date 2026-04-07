import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@src/app";
import { cleanupDB } from "@tests/setup/db";
import { seedAndAuthorize } from "@tests/setup/helpers/auth.helper";
import { buildJobPayload, getJobById, seedJob } from "@tests/setup/helpers/job.helper";
import type { AuthHeaderType, UserType } from "@tests/setup/helpers/types.helper";

describe("POST /job/:id/process as worker", () => {
    let authHeader: AuthHeaderType;
    let worker: UserType;
    let anotherWorker: UserType;
    let admin: UserType;

    beforeEach(async () => {
        await cleanupDB();

        const { _authHeader, _user } = await seedAndAuthorize({
            email: "report_worker@app.test",
            password: "password123",
            role: "worker"
        });

        const { _user: otherWorkerUser } = await seedAndAuthorize({
            email: "report_other_worker@app.test",
            password: "password123",
            role: "worker"
        });

        const { _user: adminUser } = await seedAndAuthorize({
            email: "report_admin@app.test",
            password: "password123",
            role: "admin"
        });

        authHeader = _authHeader;
        worker = _user;
        anotherWorker = otherWorkerUser;
        admin = adminUser;
    });

    it("should return 200 and mark the assigned processing job as success", async () => {
        const processingJob = await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            status: "processing",
            attempts: 1,
            assignedWorkerId: worker.id,
            lockedAt: "2026-01-01T10:05:00.000Z"
        });

        const res = await request(app)
            .post(`/job/${processingJob.id}/process`)
            .set(authHeader)
            .send({ status: "success" });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            status: "success",
            data: {
                id: processingJob.id,
                status: "success",
                attempts: 1
            },
            error: null
        });

        const updatedJob = await getJobById(processingJob.id);
        expect(updatedJob).toMatchObject({
            status: "success",
            attempts: 1,
            assigned_worker_id: null,
            locked_at: null,
            last_error: null
        });
    });

    it("should return 200, increment attempts and requeue the job when worker reports failure below max attempts", async () => {
        const processingJob = await seedJob({
            payload: buildJobPayload("medium"),
            createdBy: admin.id,
            status: "processing",
            attempts: 1,
            maxAttempts: 3,
            assignedWorkerId: worker.id,
            lockedAt: "2026-01-01T10:05:00.000Z"
        });

        const res = await request(app)
            .post(`/job/${processingJob.id}/process`)
            .set(authHeader)
            .send({
                status: "failed",
                last_error: "SMTP service timed out"
            });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            status: "success",
            data: {
                id: processingJob.id,
                status: "pending",
                attempts: 2
            },
            error: null
        });

        const updatedJob = await getJobById(processingJob.id);
        expect(updatedJob).toMatchObject({
            status: "pending",
            attempts: 2,
            last_error: "SMTP service timed out",
            assigned_worker_id: null,
            locked_at: null
        });
    });

    it("should return 200 and mark the job as failed when max attempts is reached", async () => {
        const processingJob = await seedJob({
            payload: buildJobPayload("low"),
            createdBy: admin.id,
            status: "processing",
            attempts: 2,
            maxAttempts: 3,
            assignedWorkerId: worker.id,
            lockedAt: "2026-01-01T10:05:00.000Z"
        });

        const res = await request(app)
            .post(`/job/${processingJob.id}/process`)
            .set(authHeader)
            .send({
                status: "failed",
                last_error: "Permanent downstream rejection"
            });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            status: "success",
            data: {
                id: processingJob.id,
                status: "failed",
                attempts: 3
            },
            error: null
        });

        const updatedJob = await getJobById(processingJob.id);
        expect(updatedJob).toMatchObject({
            status: "failed",
            attempts: 3,
            last_error: "Permanent downstream rejection",
            assigned_worker_id: null,
            locked_at: null
        });
    });

    it("should return 400 when the job is not assigned to the authenticated worker", async () => {
        const processingJob = await seedJob({
            payload: buildJobPayload("high"),
            createdBy: admin.id,
            status: "processing",
            assignedWorkerId: anotherWorker.id,
            lockedAt: "2026-01-01T10:05:00.000Z"
        });

        const res = await request(app)
            .post(`/job/${processingJob.id}/process`)
            .set(authHeader)
            .send({
                status: "failed",
                last_error: "Should not update"
            });

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
            status: "fail",
            error: {
                code: "JOB_UPDATE_FAILED",
                message: "Could not update job. Either it doesn't exist, isn't assigned to you, or is no longer 'processing'"
            },
            data: null
        });
    });

    it.each([
        {
            name: "invalid status",
            payload: { status: "done" },
            fieldError: { status: ["Invalid option: expected one of \"success\"|\"failed\""] }
        },
        {
            name: "missing last_error when status is failed",
            payload: { status: "failed" },
            fieldError: { last_error: ["Last error is required when status is failed"] }
        }
    ])("should return 400 for $name", async ({ payload, fieldError }) => {
        const processingJob = await seedJob({
            payload: buildJobPayload("medium"),
            createdBy: admin.id,
            status: "processing",
            assignedWorkerId: worker.id,
            lockedAt: "2026-01-01T10:05:00.000Z"
        });

        const res = await request(app)
            .post(`/job/${processingJob.id}/process`)
            .set(authHeader)
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
        });
    });
});

describe("POST /job/:id/process as admin", () => {
    let authHeader: AuthHeaderType;

    beforeEach(async () => {
        await cleanupDB();

        const { _authHeader } = await seedAndAuthorize({
            email: "report_admin_only@app.test",
            password: "password123",
            role: "admin"
        });

        authHeader = _authHeader;
    });

    it("should return 403 when admin tries to report a job outcome", async () => {
        const res = await request(app)
            .post("/job/00000000-0000-0000-0000-000000000001/process")
            .set(authHeader)
            .send({ status: "success" });

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
