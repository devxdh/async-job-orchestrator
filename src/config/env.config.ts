import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

if (existsSync(".env")) {
    loadEnvFile();
}

class EnvConfig {
    private getEnv(key: string, defaultValue?: string): string {
        const value = process.env[key] || defaultValue;
        if (!value) {
            throw new Error(`Missing Required Environment Variable: ${key}`);
        }
        return value;
    }

    public readonly PORT: number;
    public readonly JWT_SECRET: string;
    public readonly DB_USER: string;
    public readonly DB_PASSWORD: string;
    public readonly DB_PORT: number;
    public readonly DB_HOST: string;
    public readonly DB_NAME: string;
    public readonly DB_TEST_NAME: string;
    public readonly DB_WORKER_ID: string;
    public readonly TEST_DB_WORKERS: number;
    public readonly VITEST: boolean;

    constructor() {
        const workerId = this.resolveWorkerId();

        this.VITEST = !!process.env.VITEST;
        this.PORT = Number(this.getEnv("PORT", "3000"));
        this.JWT_SECRET = this.getEnv("JWT_SECRET");
        this.DB_USER = this.getEnv("DB_USER");
        this.DB_PASSWORD = this.getEnv("DB_PASSWORD");
        this.DB_HOST = this.getEnv("DB_HOST", "localhost");
        this.DB_PORT = Number(this.getEnv("DB_PORT", "5432"));
        this.DB_TEST_NAME = this.getEnv("DB_TEST_NAME", "jobapp_test");
        this.DB_WORKER_ID = workerId;
        this.TEST_DB_WORKERS = Number(this.getEnv("TEST_DB_WORKERS", "4"));

        this.DB_NAME = this.VITEST
            ? this.getWorkerDatabaseName(workerId)
            : this.getEnv("DB_NAME");
    }

    public getWorkerDatabaseName(workerId = this.DB_WORKER_ID): string {
        return `${this.DB_TEST_NAME}_${workerId}`;
    }

    private resolveWorkerId(): string {
        return process.env.VITEST_POOL_ID
            || process.env.VITEST_WORKER_ID
            || "1";
    }
}

export const env = new EnvConfig();
