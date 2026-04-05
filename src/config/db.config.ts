import { Pool } from "pg";
import { env } from "./env.config";

const DB_NAME = env.VITEST ? env.DB_TEST_NAME : env.DB_NAME;

export const db = new Pool({
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT
})
