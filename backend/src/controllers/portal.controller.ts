import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { PortalService } from "../services/portal.service";

export class PortalController {
  /**
   * Route: POST /api/portal/action
   */
  static async run(req: AuthRequest, res: Response) {
    try {
      if (!req.user || !req.profile) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { action, payload } = req.body;
      if (!action || typeof action !== "string") {
        return res.status(400).json({ error: "Action is required" });
      }

      const result = await PortalService.run(action, payload, {
        user: req.user,
        profile: req.profile,
      });

      return res.status(200).json(result ?? null);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Portal action failed" });
    }
  }
}
