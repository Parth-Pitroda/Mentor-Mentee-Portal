import { Request, Response } from "express";
import { StudentService } from "../services/student.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class StudentController {
  static async getProfile(req: AuthRequest, res: Response) {
    const profileId = String(req.params.profileId);
    const profile = await StudentService.getStudentProfile(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.status(200).json(profile);
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    const profileId = String(req.params.profileId);
    const { department, skills } = req.body;
    const result = await StudentService.updateProfileDetails(profileId, department, skills);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  static async getMenteeProfile(req: AuthRequest, res: Response) {
    const userId = String(req.params.userId);
    const profile = await StudentService.getMenteeProfile(userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.status(200).json(profile);
  }

  static async getAcademicRecords(req: AuthRequest, res: Response) {
    const studentId = String(req.params.studentId);
    const records = await StudentService.getAcademicRecordsForProfile(studentId);
    return res.status(200).json(records);
  }

  static async getAchievementRecords(req: AuthRequest, res: Response) {
    const studentId = String(req.params.studentId);
    const records = await StudentService.getAchievementRecordsForProfile(studentId);
    return res.status(200).json(records);
  }

  static async getLatestAcademic(req: AuthRequest, res: Response) {
    const studentId = String(req.params.studentId);
    const record = await StudentService.getLatestAcademicRecord(studentId);
    return res.status(200).json(record);
  }
}
