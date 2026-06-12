import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async signUp(req: Request, res: Response) {
    try {
      const { email, password, name, rollNo } = req.body;
      const result = await AuthService.signUp(email, password, name, rollNo);

      res.cookie("appwrite-session", result.sessionSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async signIn(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.signIn(email, password);

      res.cookie("appwrite-session", result.sessionSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const sessionSecret = req.cookies["appwrite-session"];
      if (!sessionSecret) return res.status(400).json({ error: "No session found" });

      await AuthService.logout(sessionSecret);
      res.clearCookie("appwrite-session");
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const sessionSecret = req.cookies["appwrite-session"];
      if (!sessionSecret) return res.status(401).json({ error: "Not authenticated" });

      const sessionData = await AuthService.validateSession(sessionSecret);
      if (!sessionData) return res.status(401).json({ error: "Session invalid" });

      const { user, profile } = sessionData;

      return res.status(200).json({
        ...user,
        accountId: user.$id,
        $id: profile.$id,
        role: profile.role,
        profile,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
