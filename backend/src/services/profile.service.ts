import { Databases, ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../../app";

export class ProfileService {
  static async getMyProfile(sessionSecret: string) {
    const databases = new Databases(createSessionClient(sessionSecret));
    const profiles = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [/* Filter by current user session logic is handled by SDK if we use correct IDs */]
    );
    // In this architecture, we'll fetch by user ID from the session
    // For simplicity, we can list and find the one matching the session user
    return profiles.documents[0];
  }

  static async getProfileById(id: string) {
    const databases = new Databases(createAdminClient());
    return await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      id
    );
  }

  static async updateProfile(id: string, data: any, sessionSecret: string) {
    const databases = new Databases(createSessionClient(sessionSecret));
    return await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      id,
      data
    );
  }

  static async listMentees() {
    const databases = new Databases(createAdminClient());
    return await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      // Query for role = mentee
    );
  }

  static async listMentors() {
    const databases = new Databases(createAdminClient());
    return await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      // Query for role = mentor
    );
  }
}
