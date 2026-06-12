import { Databases } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../../app";

export class SettingsService {
  /**
   * Retrieves settings for a user.
   * If userId is provided, uses admin client to fetch a specific user's settings.
   * Otherwise, uses session client to fetch the current user's settings.
   */
  static async getSettings(sessionSecret: string, userId?: string) {
    if (userId) {
      const databases = new Databases(createAdminClient());
      return await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
        userId
      );
    }

    const databases = new Databases(createSessionClient(sessionSecret));
    const settings = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
      []
    );
    return settings.documents[0];
  }

  /**
   * Updates settings for a user.
   * If userId is provided, uses admin client to update a specific user's settings.
   * Otherwise, uses session client to update the current user's settings.
   */
  static async updateSettings(sessionSecret: string, data: any, userId?: string) {
    if (userId) {
      const databases = new Databases(createAdminClient());
      return await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
        userId,
        data
      );
    }

    const databases = new Databases(createSessionClient(sessionSecret));
    const settings = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
      []
    );

    if (!settings.documents || settings.documents.length === 0) {
      throw new Error("Settings document not found for the current user");
    }

    const settingsId = settings.documents[0].$id;

    return await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
      settingsId,
      data
    );
  }
}
