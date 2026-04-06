import { ensureIsolatedTestDatabases } from "./db";

export default async function globalSetup() {
    await ensureIsolatedTestDatabases();
}
