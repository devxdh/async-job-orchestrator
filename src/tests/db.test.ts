import { db } from "../config/db.config.js";

async function checkDatabaseHealth() {
    try {
        await db.query(`SELECT 1`);
        console.log(`DB is Healhty`);
    } catch (err: any) {
        console.error(`DB is Unhealthy, Error: ${err.message}`)
    } finally {
        db.end(() => {
            console.log("DB connection Ended!");
        })
    }
};

checkDatabaseHealth();