import { Router } from "express"
import { authMiddleware } from "@src/middleware/auth.middleware";
import { login, remove, signup } from "./auth.controller";

const router: Router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/remove', authMiddleware, remove);

export { router as authRouter };
