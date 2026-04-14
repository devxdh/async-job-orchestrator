import express from "express";
import type { Express } from "express";
import { errorMiddleware } from "@src/middleware";
import { appRouter } from "@modules/index.route";

/**
 * This is the 'App Engine'.
 * 
 * Here is where we set up Express and tell it:
 * 1. How to parse incoming JSON.
 * 2. Where to find all our API routes (using 'appRouter').
 * 3. What to do if any of those routes have an error ('errorMiddleware').
 */

const app: Express = express();

// Middleware to parse incoming JSON bodies automatically.
app.use(express.json());

// This is where all the app's routes are connected.
app.use('/', appRouter)

// This global error handler MUST be at the end.
app.use(errorMiddleware)

export { app }
