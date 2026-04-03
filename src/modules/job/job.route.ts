import { Router } from "express";
import { restrictMiddleware } from "../../middleware/restrict.middleware.js";
import * as jobController from "./job.controller.js";

const router: Router = Router();

// Admin Routes
router.get('/', restrictMiddleware('admin'), jobController.list)
router.post('/', restrictMiddleware('admin'), jobController.create)

// Worker Routes
router.get('/next', restrictMiddleware('worker'), jobController.getNext)
router.post('/:id/process', restrictMiddleware('worker'), jobController.reportJob)

export { router as jobRouter }