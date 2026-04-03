import express from "express";
import { env } from "./config/env.config.js";
import { errorMiddleware } from "./middleware/index.js";
import { appRouter } from "./modules/index.route.js";
import { initJobScheduler } from "./modules/job/job.scheduler.js";

const PORT = env.PORT;
const app = express();

//App Middleware
app.use(express.json());

// App Route
app.use('/', appRouter);

// Workers
initJobScheduler();

// Error Handler Middleware
app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`Server is listening at ${PORT}`);
})