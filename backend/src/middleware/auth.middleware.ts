import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export interface AuthRequest extends Request {
  user?: any;
  profile?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const sessionSecret = req.cookies["appwrite-session"];
  if (!sessionSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sessionData = await AuthService.validateSession(sessionSecret);
    if (!sessionData) {
      return res.status(401).json({ error: "Invalid session or profile not found" });
    }

    req.user = sessionData.user;
    req.profile = sessionData.profile;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: "Authentication error" });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.profile) return res.status(401).json({ error: "Unauthorized" });

    if (!allowedRoles.includes(req.profile.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};
