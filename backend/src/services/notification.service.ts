import { Databases, ID } from "node-appwrite";
import { createAdminClient } from "../../app";

export class NotificationService {
  private static getAdminDatabases() {
    return new Databases(createAdminClient());
  }

  static async createNotification(userId: string, message: string, type: string, relatedId?: string) {
    try {
      const databases = this.getAdminDatabases();
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
        ID.unique(),
        {
          userId,
          message,
          type,
          isRead: false,
          relatedId: relatedId || "",
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  }

  static async notifyAssignedMentor(studentId: string, message: string, type: string, relatedId?: string) {
    try {
      const databases = this.getAdminDatabases();
      const student = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        studentId
      );

      if (!student.mentorId) return;

      await this.createNotification(student.mentorId, message, type, relatedId);
    } catch (error) {
      console.error("Failed to notify assigned mentor:", error);
    }
  }
}
