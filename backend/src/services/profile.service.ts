import { servicesContainer } from "../config/providers";

export class ProfileService {
  /**
   * Currently unused in routes (Service helper method)
   */
  static async getMyProfile(sessionSecret: string) {
    const db = servicesContainer.getSessionDatabaseService(sessionSecret);
    const profiles = await db.listDocuments(process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!);
    // In this architecture, we'll fetch by user ID from the session
    // For simplicity, we can list and find the one matching the session user
    return profiles.documents[0];
  }

  /**
   * Used in ProfileController.getById (GET /api/profiles/:id)
   */
  static async getProfileById(id: string) {
    return await servicesContainer.getDatabaseService().getDocument(process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!, id);
  }

  /**
   * Used in ProfileController.update (PATCH /api/profiles/:id)
   */
  static async updateProfile(id: string, data: any, sessionSecret: string) {
    return await servicesContainer.getSessionDatabaseService(sessionSecret).updateDocument(process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!, id, data);
  }

  /**
   * Used in ProfileController.getMentees (GET /api/profiles/mentees)
   */
  static async listMentees() {
    return await servicesContainer.getDatabaseService().listDocuments(process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!, { equals: { role: "mentee" } });
  }

  /**
   * Currently unused in routes (Service helper method)
   */
  static async listMentors() {
    return await servicesContainer.getDatabaseService().listDocuments(process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!, { equals: { role: "mentor" } });
  }
}
