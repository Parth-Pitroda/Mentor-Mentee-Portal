import { Router } from "express";
import { PortalController } from "../controllers/portal.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.post("/action", PortalController.run);

export default router;
