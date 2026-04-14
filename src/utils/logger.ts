import pino, { type LoggerOptions } from "pino";
import { env } from "@src/config/env.config";

/**
 * This is our "Black Box Recorder."
 * 
 * I chose 'Pino' because it's incredibly fast and outputs JSON, which 
 * is what professional tools (like Google Cloud Logging) expect. 
 * 
 * In development, I'm using 'pino-pretty' so the logs look nice in 
 * our terminal. In production, it stays as raw JSON for maximum speed!
 */
const loggerOptions: LoggerOptions = {
    level: env.isProduction ? "info" : "debug",
};

if (!env.isProduction) {
    loggerOptions.transport = {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
        },
    };
}

export const logger = pino(loggerOptions);
