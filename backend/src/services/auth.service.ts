import { Account, Databases, ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../../app";

export class AuthService {
  static async signUp(email: string, password: string, name: string, rollNo: string | null) {
    try {
      const adminClient = createAdminClient();
      const account = new Account(adminClient);

      const newAccount = await account.create(ID.unique(), email, password, name);
      const session = await account.createEmailPasswordSession(email, password);

      const adminDatabases = new Databases(adminClient);

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

      await adminDatabases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        newAccount.$id,
        {
          fullName: name,
          email: emailLower,
          rollNo: rollNoValue || null,
          department: "Unassigned",
          role: assignedRole,
          isVerified: false,
        }
      );

      return {
        sessionSecret: session.secret,
        userId: newAccount.$id,
        role: assignedRole,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const adminClient = createAdminClient();
      const account = new Account(adminClient);

      const emailLower = email.toLowerCase().trim();
      const session = await account.createEmailPasswordSession(emailLower, password);

      let userRole = "mentee";
      let actualProfileId = session.userId;

      try {
        const adminDatabases = new Databases(adminClient);

        const profilesList = await adminDatabases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
          [Query.equal("email", [emailLower])]
        );

        if (profilesList.total > 0) {
          userRole = profilesList.documents[0].role || "mentee";
          actualProfileId = profilesList.documents[0].$id;
        }
      } catch (err: any) {
        console.error("Profile lookup failed:", err.message);
      }

      return {
        sessionSecret: session.secret,
        userId: actualProfileId,
        role: userRole,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async logout(sessionSecret: string) {
    try {
      const sessionClient = createSessionClient(sessionSecret);
      const account = new Account(sessionClient);
      await account.deleteSession("current");
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async getUser(sessionSecret: string) {
    try {
      const sessionClient = createSessionClient(sessionSecret);
      const account = new Account(sessionClient);
      return await account.get();
    } catch (error: any) {
      return null;
    }
  }

  static async validateSession(sessionSecret: string) {
    try {
      const user = await this.getUser(sessionSecret);
      if (!user) return null;

      const databases = new Databases(createAdminClient());
      const profiles = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        [Query.equal("email", [user.email.toLowerCase().trim()])]
      );

      if (profiles.total === 0) return null;

      return {
        user,
        profile: profiles.documents[0],
      };
    } catch (error: any) {
      return null;
    }
  }
}
