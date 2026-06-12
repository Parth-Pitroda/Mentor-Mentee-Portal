import { Databases, ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../../app";
import { NotificationService } from "./notification.service";

export class MeetingService {
  private static getAdminDatabases() {
    return new Databases(createAdminClient());
  }

  private static getSessionDatabases(sessionSecret: string) {
    return new Databases(createSessionClient(sessionSecret));
  }

  /**
   * Fetch all meetings for a specific student
   */
  static async getStudentMeetings(studentId: string, sessionSecret?: string) {
    try {
      const databases = sessionSecret ? this.getSessionDatabases(sessionSecret) : this.getAdminDatabases();
      const result = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        [
          Query.equal("studentId", [studentId]),
          Query.orderDesc("date"),
        ]
      );
      return JSON.parse(JSON.stringify(result.documents));
    } catch (error) {
      console.error("Failed to fetch student meetings:", error);
      throw error;
    }
  }

  /**
   * Fetch most recent meetings for a student
   */
  static async getRecentMeetings(studentId: string, limit: number = 5) {
    try {
      const databases = this.getAdminDatabases();
      const result = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        [
          Query.equal("studentId", [studentId]),
          Query.orderDesc("date"),
          Query.limit(limit),
        ]
      );
      return JSON.parse(JSON.stringify(result.documents));
    } catch (error) {
      console.error("Failed to fetch recent meetings:", error);
      return [];
    }
  }

  /**
   * Fetch meetings with "Requested" status for a student
   */
  static async getPendingRequests(studentId: string) {
    try {
      const databases = this.getAdminDatabases();
      const result = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        [
          Query.equal("studentId", [studentId]),
          Query.equal("status", ["Requested"]),
        ]
      );
      return JSON.parse(JSON.stringify(result.documents));
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      return [];
    }
  }

  /**
   * Create a new meeting (Request or Log)
   */
  static async createMeeting(data: any, sessionSecret?: string) {
    try {
      const databases = sessionSecret ? this.getSessionDatabases(sessionSecret) : this.getAdminDatabases();

      const createdMeeting = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        ID.unique(),
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
   * Update meeting details or status
   */
  static async updateMeeting(meetingId: string, updates: any, sessionSecret?: string) {
    try {
      const databases = sessionSecret ? this.getSessionDatabases(sessionSecret) : this.getAdminDatabases();

      const updatedMeeting = await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
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
   * Fetch all "Requested" meetings for a mentor's students
   */
  static async getMentorRequests(mentorId: string) {
    try {
      const databases = this.getAdminDatabases();
      const menteesList = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        [Query.equal("mentorId", [mentorId]), Query.limit(100)]
      );

      if (menteesList.total === 0) return [];

      const menteeIds = menteesList.documents.map(doc => doc.$id);
      const studentMap: Record<string, string> = {};
      menteesList.documents.forEach(doc => {
        studentMap[doc.$id] = doc.fullName || "Unknown Student";
      });

      const requests = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        [
          Query.equal("studentId", menteeIds),
          Query.equal("status", ["Requested"]),
          Query.orderDesc("$createdAt"),
        ]
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
   * Fetch "Confirmed" meetings for a mentor's students
   */
  static async getMentorScheduled(mentorId: string) {
    try {
      const databases = this.getAdminDatabases();
      const menteesList = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        [Query.equal("mentorId", [mentorId]), Query.limit(100)]
      );

      if (menteesList.total === 0) return [];

      const menteeIds = menteesList.documents.map(doc => doc.$id);
      const studentMap: Record<string, string> = {};
      menteesList.documents.forEach(doc => {
        studentMap[doc.$id] = doc.fullName || "Unknown Student";
      });

      const scheduled = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        [
          Query.equal("studentId", menteeIds),
          Query.equal("status", ["Confirmed"]),
          Query.orderAsc("date"),
        ]
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
