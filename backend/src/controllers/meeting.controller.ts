import { Request, Response } from "express";
import { MeetingService } from "../services/meeting.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class MeetingController {
  /**
   * Route: GET /api/meetings/student/:studentId
   */
  static async getMeetings(req: AuthRequest, res: Response) {
    const studentId = String(req.params.studentId);
    const meetings = await MeetingService.getStudentMeetings(studentId, req.cookies["appwrite-session"]);
    return res.status(200).json(meetings);
  }

  /**
   * Route: POST /api/meetings/log
   */
  static async logMeeting(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const result = await MeetingService.createMeeting({ ...data, status: "Pending" }, req.cookies["appwrite-session"]);
      if (!result.success) return res.status(400).json({ error: result.error });
      return res.status(201).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Route: PATCH /api/meetings/status/:meetingId/:studentId
   */
  static async updateStatus(req: AuthRequest, res: Response) {
    const meetingId = String(req.params.meetingId);
    const studentId = String(req.params.studentId);
    const { newStatus } = req.body;
    const result = await MeetingService.updateMeeting(meetingId, { status: newStatus }, req.cookies["appwrite-session"]);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  /**
   * Route: GET /api/meetings/requests/:mentorId
   */
  static async getRequests(req: AuthRequest, res: Response) {
    const mentorId = String(req.params.mentorId);
    const requests = await MeetingService.getMentorRequests(mentorId);
    return res.status(200).json(requests);
  }

  /**
   * Route: POST /api/meetings/respond/:meetingId
   */
  static async respondToRequest(req: AuthRequest, res: Response) {
    const meetingId = String(req.params.meetingId);
    const { response, message } = req.body;
    const result = await MeetingService.updateMeeting(meetingId, {
      status: response,
      ...(message ? { description: message } : {}),
    }, req.cookies["appwrite-session"]);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.status(200).json({ success: true });
  }
}
