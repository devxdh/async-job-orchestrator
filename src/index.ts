import express from "express";
import { env } from "./config/env.config.js";
import { errorMiddleware } from "./middleware/index.js";
import { appRouter } from "./modules/index.module.js";

const PORT = env.PORT;
const app = express();

//App Middleware
app.use(express.json());

// App Route
app.use('/', appRouter)

// Error Handler Middleware
app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`Server is listening at ${PORT}`);
})