import { Databases, ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../../app";

export class NoticeService {
  private static getAdminDatabases() {
    return new Databases(createAdminClient());
  }

  private static getSessionDatabases(sessionSecret: string) {
    return new Databases(createSessionClient(sessionSecret));
  }

  static async getNotices(sessionSecret?: string) {
    try {
      const databases = sessionSecret
        ? this.getSessionDatabases(sessionSecret)
        : this.getAdminDatabases();

      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID!,
        [Query.orderDesc("$createdAt")]
      );

      return response.documents;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch notices");
    }
  }

  static async createNotice(data: { title: string; content: string; targetAudience: string }) {
    try {
      const databases = this.getAdminDatabases();
      const response = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID!,
        ID.unique(),
        {
          ...data,
          createdAt: new Date().toISOString(),
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create notice");
    }
  }
}
