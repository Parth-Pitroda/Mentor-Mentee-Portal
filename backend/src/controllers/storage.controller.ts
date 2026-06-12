import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { StorageService } from "../services/storage.service";

export class StorageController {
  static async view(req: AuthRequest, res: Response) {
    try {
      const file = await StorageService.getFileView(String(req.params.fileId));
      res.setHeader("Cache-Control", "private, max-age=300");
      return res.send(file);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "File not found" });
    }
  }
}
