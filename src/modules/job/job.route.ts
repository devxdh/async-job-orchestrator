import { Router } from "express";
import { restrictMiddleware } from "@src/middleware/restrict.middleware";
import * as jobController from "./job.controller";

const router: Router = Router();

// Admin Routes
router.get('/', restrictMiddleware('admin'), jobController.list)
router.post('/', restrictMiddleware('admin'), jobController.create)

// Worker Routes
router.get('/next', restrictMiddleware('worker'), jobController.getNext)
router.post('/:id/process', restrictMiddleware('worker'), jobController.reportJob)

export { router as jobRouter }
