import { NotificationService } from "./notification.service";
import { servicesContainer } from "../config/providers";

export class MeetingService {
  private static getDatabase(sessionSecret?: string) {
    return sessionSecret
      ? servicesContainer.getSessionDatabaseService(sessionSecret)
      : servicesContainer.getDatabaseService();
  }

  /**
   * Used in MeetingController.getMeetings (GET /api/meetings/student/:studentId)
   */
  static async getStudentMeetings(studentId: string, sessionSecret?: string) {
    try {
      const db = this.getDatabase(sessionSecret);
      const result = await db.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        { equals: { studentId }, orderByDesc: "date" }
      );
      return JSON.parse(JSON.stringify(result.documents));
    } catch (error) {
      console.error("Failed to fetch student meetings:", error);
      throw error;
    }
  }

  /**
   * Currently unused in routes (Service helper method)
   */
  static async getRecentMeetings(studentId: string, limit: number = 5) {
    try {
      const result = await this.getDatabase().listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        { equals: { studentId }, orderByDesc: "date", limit }
      );
      return JSON.parse(JSON.stringify(result.documents));
    } catch (error) {
      console.error("Failed to fetch recent meetings:", error);
      return [];
    }
  }

  /**
   * Currently unused in routes (Service helper method)
   */
  static async getPendingRequests(studentId: string) {
    try {
      const result = await this.getDatabase().listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        { equals: { studentId, status: "Requested" } }
      );
      return JSON.parse(JSON.stringify(result.documents));
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      return [];
    }
  }

  /**
   * Used in MeetingController.logMeeting (POST /api/meetings/log)
   */
  static async createMeeting(data: any, sessionSecret?: string) {
    try {
      const db = this.getDatabase(sessionSecret);

      const createdMeeting = await db.createDocument<any>(
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        {
          studentId: data.studentId,
          date: data.date,
          topic: data.topic,
          description: data.description,
          status: data.status || "Requested",
          mentorName: data.mentorName,
        }
      );

      // If it's a meeting log being submitted for verification
      if (data.status === "Pending") {
        await NotificationService.notifyAssignedMentor(
          data.studentId,
          `A meeting log for "${data.topic}" is waiting for your review.`,
          "meeting_log_submission",
          createdMeeting.$id
        );
      }

      return { success: true, meeting: createdMeeting };
    } catch (error: any) {
      console.error("Failed to create meeting:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Used in:
   * - MeetingController.updateStatus (PATCH /api/meetings/status/:meetingId/:studentId)
   * - MeetingController.respondToRequest (POST /api/meetings/respond/:meetingId)
   */
  static async updateMeeting(meetingId: string, updates: any, sessionSecret?: string) {
    try {
      const db = this.getDatabase(sessionSecret);

      const updatedMeeting = await db.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        meetingId,
        updates
      );

      return { success: true, meeting: updatedMeeting };
    } catch (error: any) {
      console.error("Failed to update meeting:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Used in MeetingController.getRequests (GET /api/meetings/requests/:mentorId)
   */
  static async getMentorRequests(mentorId: string) {
    try {
      const db = this.getDatabase();
      const menteesList = await db.listDocuments<any>(
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        { equals: { mentorId }, limit: 100 }
      );

      if (menteesList.total === 0) return [];

      const menteeIds = menteesList.documents.map(doc => doc.$id);
      const studentMap: Record<string, string> = {};
      menteesList.documents.forEach(doc => {
        studentMap[doc.$id] = doc.fullName || "Unknown Student";
      });

      const requests = await db.listDocuments<any>(
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        { equals: { studentId: menteeIds, status: "Requested" }, orderByDesc: "$createdAt" }
      );

      return requests.documents.map((request) => ({
        ...request,
        studentName: studentMap[request.studentId] || "Unknown Student",
      }));
    } catch (error) {
      console.error("Failed to fetch mentor requests:", error);
      return [];
    }
  }

  /**
   * Used in PortalService.getMentorScheduledMeetings (invoked by POST /api/portal/action)
   */
  static async getMentorScheduled(mentorId: string) {
    try {
      const db = this.getDatabase();
      const menteesList = await db.listDocuments<any>(
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        { equals: { mentorId }, limit: 100 }
      );

      if (menteesList.total === 0) return [];

      const menteeIds = menteesList.documents.map(doc => doc.$id);
      const studentMap: Record<string, string> = {};
      menteesList.documents.forEach(doc => {
        studentMap[doc.$id] = doc.fullName || "Unknown Student";
      });

      const scheduled = await db.listDocuments<any>(
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        { equals: { studentId: menteeIds, status: "Confirmed" }, orderByAsc: "date" }
      );

      return scheduled.documents.map((meeting) => ({
        ...meeting,
        studentName: studentMap[meeting.studentId] || "Unknown Student",
      }));
    } catch (error) {
      console.error("Failed to fetch mentor scheduled meetings:", error);
      return [];
    }
  }
}
