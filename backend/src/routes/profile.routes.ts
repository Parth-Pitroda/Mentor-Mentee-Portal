import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { authMiddleware, roleMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, ProfileController.getMe);
router.get("/mentees", authMiddleware, roleMiddleware(["admin", "mentor"]), ProfileController.getMentees);
router.get("/:id", authMiddleware, ProfileController.getById);
router.patch("/:id", authMiddleware, ProfileController.update);

export default router;
