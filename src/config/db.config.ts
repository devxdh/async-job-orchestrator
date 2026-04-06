import { Pool } from "pg";
import { env } from "./env.config";

export const createDbPool = (database = env.DB_NAME) => {
    return new Pool({
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database,
        host: env.DB_HOST,
        port: env.DB_PORT
    });
};

export const db = createDbPool();
