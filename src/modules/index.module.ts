import { Router } from "express";
import { userRouter } from "./auth/auth.route.js";
import { jobRouter } from "./job/job.route.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.use('/auth', userRouter);
router.use('/job', authMiddleware, jobRouter);

export { router as appRouter };