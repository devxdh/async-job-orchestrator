import { db } from "@src/config/db.config";
import { env } from "@src/config/env.config";

export const cleanupDB = async () => {
    if (!env.VITEST) return;

    try {
        await db.query(`TRUNCATE TABLE users, job RESTART IDENTITY CASCADE`);
    } catch (err) {
        console.error("Failed to cleanup database: ", err);
        throw err;
    };
};