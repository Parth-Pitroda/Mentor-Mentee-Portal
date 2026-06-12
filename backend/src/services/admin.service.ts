import { Databases, ID, Query, Users } from "node-appwrite";
import { createAdminClient } from "../../app";

export class AdminService {
  private static getAdminDatabases() {
    return new Databases(createAdminClient());
  }

  static async getSystemAnalytics() {
    try {
      const databases = this.getAdminDatabases();
      const [mentees, verifiedMentees, meetings] = await Promise.all([
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
          [Query.equal("role", ["mentee"])]
        ),
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
          [Query.equal("role", ["mentee"]), Query.equal("isVerified", [true])]
        ),
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!
        )
      ]);

      return {
        totalStudents: mentees.total,
        verifiedStudents: verifiedMentees.total,
        pendingVerifications: mentees.total - verifiedMentees.total,
        totalMeetings: meetings.total,
      };
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      return { totalStudents: 0, verifiedStudents: 0, pendingVerifications: 0, totalMeetings: 0 };
    }
  }

  static async assignMentor(studentId: string, mentorId: string) {
    try {
      const databases = this.getAdminDatabases();
      const [student, mentor] = await Promise.all([
        databases.getDocument(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!, process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!, studentId),
        databases.getDocument(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!, process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!, mentorId),
      ]);

      if (student.role !== "mentee" || mentor.role !== "mentor") {
        throw new Error("Please select a valid student and mentor.");
      }

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        studentId,
        { mentorId: mentorId }
      );

      return { success: true };
    } catch (error: any) {
      console.error("Assignment failed:", error);
      return { success: false, error: error.message };
    }
  }

  static async createGlobalNotice(title: string, content: string) {
    try {
      const databases = this.getAdminDatabases();
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID!,
        ID.unique(),
        { title, content }
      );
      return { success: true };
    } catch (error: any) {
      console.error("Failed to post notice:", error);
      return { success: false, error: error.message };
    }
  }

  static async bulkImportStudents(studentList: Array<{ fullName: string, email: string, department: string }>) {
    try {
      const adminClient = createAdminClient();
      const databases = new Databases(adminClient);
      const users = new Users(adminClient);

      let successCount = 0;
      let errors = [];

      for (const student of studentList) {
        try {
          const emailLower = student.email.toLowerCase().trim();
          await users.create(ID.unique(), emailLower, undefined, "Pdeu@2026", student.fullName.trim());
          await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
            ID.unique(),
            {
              email: emailLower,
              fullName: student.fullName.trim(),
              department: student.department.trim(),
              role: "mentee",
              isVerified: true,
            }
          );
          successCount++;
        } catch (err: any) {
          errors.push(`Failed for ${student.email}: ${err.message}`);
        }
      }
      return { success: true, successCount, errors };
    } catch (error: any) {
      console.error("Bulk import failed critically:", error);
      return { success: false, error: error.message };
    }
  }
}
