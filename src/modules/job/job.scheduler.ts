import { recoverStuckJob } from "./job.service";

/**
 * This is my background recovery system. 
 * 
 * Sometimes, things go wrong; a worker might crash, or the server 
 * might restart while a job is in the 'processing' state. 
 * 
 * Without this, those jobs would stay "locked" forever. This scheduler 
 * runs every 30 minutes to find any job that's been stuck for too long 
 * and puts it back into 'pending' so it can be finished.
 */

const THIRTY_MINUTES = 30 * 60 * 1000

export const initJobScheduler = () => {
    console.log(`[Scheduler] Background recovery worker started.`);

    // I run it once right when the server starts, just in case there were 
    // stuck jobs from a previous crash.
    recoverStuckJob().catch(err => console.error(`[Scheduler Error]: ${err}`));

    // Then it runs every 30 minutes after that.
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
