import { servicesContainer } from "../config/providers";

export class AdminService {
  static async getSystemAnalytics() {
    try {
      const db = servicesContainer.getDatabaseService();
      const profileColl = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
      const meetingColl = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;
      const [mentees, verifiedMentees, meetings] = await Promise.all([
        db.listDocuments(profileColl, { equals: { role: "mentee" } }),
        db.listDocuments(profileColl, { equals: { role: "mentee", isVerified: true } }),
        db.listDocuments(meetingColl)
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
      const db = servicesContainer.getDatabaseService();
      const profileColl = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

      const [student, mentor] = await Promise.all([
        db.getDocument(profileColl, studentId),
        db.getDocument(profileColl, mentorId),
      ]);

      if ((student as any).role !== "mentee" || (mentor as any).role !== "mentor") {
        throw new Error("Please select a valid student and mentor.");
      }

      await db.updateDocument(
        profileColl,
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
      const db = servicesContainer.getDatabaseService();
      const noticeColl = process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID!;
      await db.createDocument(
        noticeColl,
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
      const auth = servicesContainer.getAuthService();
      const db = servicesContainer.getDatabaseService();
      const profileColl = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

      let successCount = 0;
      let errors = [];

      for (const student of studentList) {
        try {
          const emailLower = student.email.toLowerCase().trim();
          await auth.createUser(emailLower, student.fullName.trim(), "mentee");
          await db.createDocument(
            profileColl,
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
