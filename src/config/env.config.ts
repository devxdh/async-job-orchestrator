import { loadEnvFile } from "process";
loadEnvFile()

class EnvConfig {
    constructor() {
        this.PORT = process.env.PORT!;
        this.DB_USER = process.env.DB_USER!;
        this.DB_PASSWORD = process.env.DB_PASSWORD!;
        this.DB_PORT = Number(process.env.DB_PORT) || 5432;
        this.DB_HOST = process.env.DB_HOST!;
        this.DB_NAME = process.env.DB_NAME!;
        this.JWT_SECRET = process.env.JWT_SECRET!;
    }

    PORT: string;
    JWT_SECRET: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_PORT: number;
    DB_HOST: string;
    DB_NAME: string;
}

export const env = new EnvConfig();