import { Router } from "express"
import { login, remove, signup } from "./auth.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router: Router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/remove', authMiddleware, remove);

export { router as userRouter };