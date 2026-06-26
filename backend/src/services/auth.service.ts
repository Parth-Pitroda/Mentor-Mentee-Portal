import { servicesContainer } from "../config/providers";

export class AuthService {
  static async signUp(email: string, password: string, name: string, rollNo: string | null) {
    try {
      const auth = servicesContainer.getAuthService();
      const db = servicesContainer.getDatabaseService();
      const newAccount = await auth.createUser(email, name, "pending", password);
      const session = await auth.createEmailPasswordSession(email, password);

      const emailLower = email.toLowerCase().trim();
      const rollNoValue = rollNo?.trim() || "";

      const allowedDomains = (process.env.MENTOR_EMAIL_DOMAINS || "")
        .split(",")
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean);

      const emailDomain = emailLower.split("@")[1] || "";
      const emailLocalPart = emailLower.split("@")[0] || "";
      const looksLikeStudentEmail = /^\d{2}[a-z]{3}\d+[a-z]?$/i.test(emailLocalPart);
      const isStudent = Boolean(rollNoValue) || looksLikeStudentEmail;
      const isAllowedMentorDomain = allowedDomains.length === 0 || allowedDomains.includes(emailDomain);
      const assignedRole = !isStudent && isAllowedMentorDomain ? "mentor" : "mentee";

      await db.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        {
          fullName: name,
          email: emailLower,
          rollNo: rollNoValue || null,
          department: "Unassigned",
          role: assignedRole,
          isVerified: false,
        },
        newAccount.userId
      );

      return {
        sessionSecret: session.sessionSecret,
        userId: newAccount.userId,
        role: assignedRole,
      };
    } catch (error: any) {
      console.error("AuthService.signUp error:", error);
      throw new Error(error?.message || String(error));
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const auth = servicesContainer.getAuthService();
      const db = servicesContainer.getDatabaseService();
      const emailLower = email.toLowerCase().trim();
      const session = await auth.createEmailPasswordSession(emailLower, password);

      let userRole = "mentee";
      let actualProfileId = session.userId;

      try {
        const profilesList = await db.listDocuments<any>(
          process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
          { equals: { email: emailLower } }
        );

        if (profilesList.total > 0) {
          userRole = profilesList.documents[0].role || "mentee";
          actualProfileId = profilesList.documents[0].$id;
        }
      } catch (err: any) {
        console.error("Profile lookup failed:", err.message);
      }

      return {
        sessionSecret: session.sessionSecret,
        userId: actualProfileId,
        role: userRole,
      };
    } catch (error: any) {
      console.error("AuthService.signIn error:", error);
      throw new Error(error?.message || String(error));
    }
  }

  static async logout(sessionSecret: string) {
    try {
      await servicesContainer.getAuthService().deleteCurrentSession(sessionSecret);
      return { success: true };
    } catch (error: any) {
      console.error("AuthService.logout error:", error);
      throw new Error(error?.message || String(error));
    }
  }

  static async getUser(sessionSecret: string) {
    try {
      return await servicesContainer.getAuthService().getSessionUser(sessionSecret);
    } catch (error: any) {
      console.error("AuthService.getUser error:", error);
      return null;
    }
  }

  static async validateSession(sessionSecret: string) {
    try {
      const user = await this.getUser(sessionSecret);
      if (!user) return null;

      const profiles = await servicesContainer.getDatabaseService().listDocuments<any>(
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        { equals: { email: user.email.toLowerCase().trim() } }
      );

      if (profiles.total === 0) return null;

      return {
        user,
        profile: profiles.documents[0],
      };
    } catch (error: any) {
      console.error("AuthService.validateSession error:", error);
      return null;
    }
  }
}
