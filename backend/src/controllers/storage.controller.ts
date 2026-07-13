import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { StorageService } from "../services/storage.service";

export class StorageController {
  static async view(req: AuthRequest, res: Response) {
    try {
      const file = await StorageService.getFile(String(req.params.fileId));
      
      const isDownload = req.query.download === "1" || req.query.download === "true";
      
      res.setHeader("Cache-Control", "private, max-age=300");
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      res.setHeader("Content-Length", String(file.buffer.length));
      res.setHeader("Content-Disposition", `${isDownload ? "attachment" : "inline"}; filename="${safeFileName(file.fileName)}"`);
      
      return res.send(file.buffer);
    } catch (error: any) {
      // Clear headers if they were partially set, so we can return a proper JSON error
      res.removeHeader("Content-Type");
      res.removeHeader("Content-Length");
      res.removeHeader("Content-Disposition");
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
