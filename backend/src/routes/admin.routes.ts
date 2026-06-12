import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware, roleMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(["admin", "coordinator"]));

router.get("/analytics", AdminController.getAnalytics);
router.post("/assign-mentor", AdminController.assignMentor);
router.post("/notice", AdminController.createNotice);
router.post("/bulk-import", AdminController.bulkImport);

export default router;
