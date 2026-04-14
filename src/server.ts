import { env } from "@src/config/env.config";
import { app } from "./app";
import { initJobScheduler } from "@modules/job/job.scheduler";
import { logger } from "@src/utils/logger";

/**
 * This is the "Ignition."
 * 
 * I start the Express app here and also initialize our background 
 * job scheduler. I'm using our 'logger' (Pino) to let everyone know 
 * the server is officially up and running!
 */

const startServer = () => {
    app.listen(env.PORT, () => {
        logger.info(`[Server] Core engine started on port ${env.PORT} in ${env.NODE_ENV} mode.`);
        
        // Starts the background recovery process.
        initJobScheduler();
    });
};

startServer();
