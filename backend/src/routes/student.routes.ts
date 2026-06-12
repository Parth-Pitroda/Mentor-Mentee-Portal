import { Router } from "express";
import { StudentController } from "../controllers/student.controller";
import { authMiddleware, roleMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/profile/:profileId", roleMiddleware(["admin", "coordinator", "mentor"]), StudentController.getProfile);
router.put("/profile/:profileId", roleMiddleware(["mentee"]), StudentController.updateProfile);
router.get("/mentee/:userId", authMiddleware, StudentController.getMenteeProfile);
router.get("/academics/:studentId", roleMiddleware(["admin", "coordinator", "mentor"]), StudentController.getAcademicRecords);
router.get("/achievements/:studentId", roleMiddleware(["admin", "coordinator", "mentor"]), StudentController.getAchievementRecords);
router.get("/academics/latest/:studentId", roleMiddleware(["admin", "coordinator", "mentor"]), StudentController.getLatestAcademic);

export default router;
