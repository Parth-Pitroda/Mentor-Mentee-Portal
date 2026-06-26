import { servicesContainer } from "../config/providers";

export class NotificationService {
  static async createNotification(userId: string, message: string, type: string, relatedId?: string) {
    try {
      const db = servicesContainer.getDatabaseService();
      await db.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
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
      const db = servicesContainer.getDatabaseService();
      const student = await db.getDocument<any>(
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
