import { env } from "@src/config/env.config";
import { app } from "@src/app";
import { initJobScheduler } from "@modules/job/job.scheduler";

const PORT = env.PORT;

// Workers
initJobScheduler();

app.listen(PORT, () => {
    console.log(`Server is listening at ${PORT}`);
})
