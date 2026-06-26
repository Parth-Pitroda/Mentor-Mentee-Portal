import { servicesContainer } from "../config/providers";

export class NoticeService {
  static async getNotices(sessionSecret?: string) {
    try {
      const db = sessionSecret
        ? servicesContainer.getSessionDatabaseService(sessionSecret)
        : servicesContainer.getDatabaseService();

      const response = await db.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID!,
        { orderByDesc: "$createdAt" }
      );

      return response.documents;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch notices");
    }
  }

  static async createNotice(data: { title: string; content: string; targetAudience: string }) {
    try {
      const response = await servicesContainer.getDatabaseService().createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID!,
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
