import { Request, Response } from "express";
import { SettingsService } from "../services/settings.service";

export class SettingsController {
  /**
   * Get settings for the currently authenticated user.
   */
  static async getSettings(req: any, res: Response) {
    try {
      const sessionSecret = req.cookies["appwrite-session"];
      const settings = await SettingsService.getSettings(sessionSecret);
      return res.status(200).json(settings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get settings for a specific user by ID.
   */
  static async getSettingsById(req: Request, res: Response) {
    try {
      const sessionSecret = req.cookies["appwrite-session"];
      const userId = String(req.params.id);
      const settings = await SettingsService.getSettings(sessionSecret, userId);
      return res.status(200).json(settings);
    } catch (error: any) {
      return res.status(404).json({ error: "Settings not found" });
    }
  }

  /**
   * Update settings for the currently authenticated user.
   */
  static async updateSettings(req: any, res: Response) {
    try {
      const sessionSecret = req.cookies["appwrite-session"];
      const data = req.body;
      const updated = await SettingsService.updateSettings(sessionSecret, data);
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update settings for a specific user by ID.
   */
  static async updateSettingsById(req: any, res: Response) {
    try {
      const sessionSecret = req.cookies["appwrite-session"];
      const userId = String(req.params.id);
      const data = req.body;
      const updated = await SettingsService.updateSettings(sessionSecret, data, userId);
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
