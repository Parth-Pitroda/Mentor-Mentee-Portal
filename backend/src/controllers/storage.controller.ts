import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { StorageService } from "../services/storage.service";

export class StorageController {
  /**
   * Route: GET /api/storage/files/:fileId/view
   */
  static async view(req: AuthRequest, res: Response) {
    try {
      const file = await StorageService.getFile(String(req.params.fileId));
      res.setHeader("Cache-Control", "private, max-age=300");
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Length", String(file.buffer.length));
      const isDownload = req.query.download === "1" || req.query.download === "true";
      res.setHeader("Content-Disposition", `${isDownload ? "attachment" : "inline"}; filename="${safeFileName(file.fileName)}"`);
      return res.end(file.buffer);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "File not found" });
    }
  }
}

function safeFileName(fileName: string) {
  // Strip non-ASCII characters to prevent Node.js header validation crashes
  const asciiOnly = fileName.replace(/[^\x20-\x7E]/g, "_");
  // Strip double quotes, backslashes, semicolons, and newlines which break Content-Disposition
  return asciiOnly.replace(/["\\\r\n;]/g, "_");
}
