import { recoverStuckJob } from "./job.service";

const THIRTY_MINUTES = 30 * 60 * 1000

export const initJobScheduler = () => {
    console.log(`[Scheduler] Background recovery worker started.`);

    // Starts immediately one time with the start of the server
    recoverStuckJob().catch(err => console.error(`[Scheduler Error]: ${err}`));

    // Runes every 30 mintues to ensure the recovery of stuck jobs
    setInterval(async () => {
        try {
            const recovered = await recoverStuckJob();
            if (recovered.length > 0) {
                console.log(`[Scheduler] Auto recovered ${recovered.length} stuck jobs!`);
            }
        } catch (err) {
            console.error(`[Scheduler Error]: ${err}`)
        }
    }, THIRTY_MINUTES);
};
