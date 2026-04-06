import { Client } from "pg";
import { db } from "@src/config/db.config";
import { env } from "@src/config/env.config";
import { setupQueries } from "./queries";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export type RoleType = 'worker' | 'admin';

type SeedUserType = {
    email: string;
    password: string;
    role: RoleType;
}

type signJWTType = {
    id: string;
    role: RoleType;
}

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
        for (let workerNumber = 1; workerNumber <= env.TEST_DB_WORKERS; workerNumber += 1) {
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



export const seedUser = async ({ email, password, role }: SeedUserType) => {
    const hashed_password = await bcrypt.hash(password, 10)
    const result = await db.query(
        `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role`,
        [email, hashed_password, role]
    )

    return result.rows[0];
}

export const signJWT = ({ id, role }: signJWTType) => {
    return jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: '1h' });
}