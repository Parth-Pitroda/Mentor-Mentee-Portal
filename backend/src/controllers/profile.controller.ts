import { Request, Response } from "express";
import { ProfileService } from "../services/profile.service";

export class ProfileController {
  /**
   * Route: GET /api/profiles/me
   */
  static async getMe(req: any, res: Response) {
    try {
      return res.status(200).json(req.profile);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Route: GET /api/profiles/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const profile = await ProfileService.getProfileById(String(req.params.id));
      return res.status(200).json(profile);
    } catch (error: any) {
      return res.status(404).json({ error: "Profile not found" });
    }
  }

  /**
   * Route: PATCH /api/profiles/:id
   */
  static async update(req: any, res: Response) {
    try {
      const updated = await ProfileService.updateProfile(
        req.profile.$id,
        req.body,
        req.cookies["appwrite-session"]
      );
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Route: GET /api/profiles/mentees
   */
  static async getMentees(req: Request, res: Response) {
    try {
      const mentees = await ProfileService.listMentees();
      return res.status(200).json(mentees);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
