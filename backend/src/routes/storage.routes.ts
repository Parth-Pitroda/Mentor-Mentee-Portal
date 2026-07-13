import { Router } from "express";
import { StorageController } from "../controllers/storage.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// File view is public — opened in new browser tabs where session cookies
// aren't sent cross-origin.  File IDs are random UUIDs (not guessable).
router.get("/files/:fileId/view", StorageController.view);

// All other storage routes remain authenticated
router.use(authMiddleware);

export default router;
