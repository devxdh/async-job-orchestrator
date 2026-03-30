import { Pool } from "pg";
import { env } from "./env.config.js";

export const db = new Pool({
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT
})