import { Router } from "express";
import { MeetingController } from "../controllers/meeting.controller";
import { authMiddleware, roleMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/student/:studentId", roleMiddleware(["admin", "coordinator", "mentor", "mentee"]), MeetingController.getMeetings);
router.post("/log", roleMiddleware(["mentee"]), MeetingController.logMeeting);
router.patch("/status/:meetingId/:studentId", roleMiddleware(["mentor"]), MeetingController.updateStatus);
router.get("/requests/:mentorId", roleMiddleware(["mentor"]), MeetingController.getRequests);
router.post("/respond/:meetingId", roleMiddleware(["mentor"]), MeetingController.respondToRequest);

export default router;
