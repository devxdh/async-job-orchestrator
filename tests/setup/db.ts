import { Client } from "pg";
import { db } from "@src/config/db.config";
import { env } from "@src/config/env.config";
import { setupQueries } from "./queries";


const quoteIdentifier = (value: string) => `"${value.replaceAll(`"`, `""`)}"`;

const createAdminClient = (database = "postgres") => {
    return new Client({
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        host: env.DB_HOST,
        port: env.DB_PORT,
        database
    });
};

const recreateDatabase = async (client: Client, databaseName: string) => {
    const quotedDbName = quoteIdentifier(databaseName);

    await client.query(
        `
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = $1
              AND pid <> pg_backend_pid()
        `,
        [databaseName]
    );

    await client.query(`DROP DATABASE IF EXISTS ${quotedDbName}`);
    await client.query(`CREATE DATABASE ${quotedDbName}`);
};

export const ensureIsolatedTestDatabases = async () => {
    if (!env.VITEST) {
        return;
    }

    const adminClient = createAdminClient();
    await adminClient.connect();

    try {
        for (let workerNumber = 1; workerNumber <= env.DB_TEST_WORKERS; workerNumber += 1) {
            const databaseName = env.getWorkerDatabaseName(String(workerNumber));

            await recreateDatabase(adminClient, databaseName);

            const workerClient = createAdminClient(databaseName);
            await workerClient.connect();

            try {
                await workerClient.query(setupQueries.template);
            } finally {
                await workerClient.end();
            }
        }
    } finally {
        await adminClient.end();
    }
};

export const cleanupDB = async () => {
    if (!env.VITEST) return;

    try {
        await db.query(`TRUNCATE TABLE users, job RESTART IDENTITY CASCADE`);
    } catch (err) {
        console.error("[SETUP] Failed to cleanup database: ", err);
        throw err;
    };
};