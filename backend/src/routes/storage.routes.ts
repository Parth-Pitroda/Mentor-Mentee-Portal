import { Router } from "express";
import { StorageController } from "../controllers/storage.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/files/:fileId/view", StorageController.view);

export default router;
