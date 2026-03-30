import { authMiddleware } from "./auth.middleware.js"
import { restrictMiddleware } from "./restrict.middleware.js"
import { errorMiddleware } from "./error.middleware.js"

export { authMiddleware, errorMiddleware, restrictMiddleware }