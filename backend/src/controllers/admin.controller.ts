import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class AdminController {
  /**
   * Route: GET /api/admin/analytics
   */
  static async getAnalytics(req: AuthRequest, res: Response) {
    const analytics = await AdminService.getSystemAnalytics();
    return res.status(200).json(analytics);
  }

  /**
   * Route: POST /api/admin/assign-mentor
   */
  static async assignMentor(req: AuthRequest, res: Response) {
    const { studentId, mentorId } = req.body;
    const result = await AdminService.assignMentor(studentId, mentorId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  /**
   * Route: POST /api/admin/notice
   */
  static async createNotice(req: AuthRequest, res: Response) {
    const { title, content } = req.body;
    const result = await AdminService.createGlobalNotice(title, content);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.status(201).json({ success: true });
  }

  /**
   * Route: POST /api/admin/bulk-import
   */
  static async bulkImport(req: AuthRequest, res: Response) {
    const { students } = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ error: "Students list must be an array" });
    const result = await AdminService.bulkImportStudents(students);
    return res.status(200).json(result);
  }
}
