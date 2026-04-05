import express from "express";
import type { Express } from "express";
import { errorMiddleware } from "@src/middleware";
import { appRouter } from "@modules/index.route";

const app: Express = express();

// App Middlewares
app.use(express.json());

// App Routes
app.use('/', appRouter)

// Error Handler Middleware
app.use(errorMiddleware)

export { app }
