import { Router } from "express";
import { authRouter } from "./auth/auth.route";
import { jobRouter } from "./job/job.route";
import { authMiddleware } from "@src/middleware";

const router: Router = Router();

router.use('/auth', authRouter);
router.use('/job', authMiddleware, jobRouter);

export { router as appRouter };
