import { ProfileUpdateSchema } from "../validators/updateProfile";
import { servicesContainer } from "../config/providers";

export class StudentService {
  /**
   * Internal helper used in various authentication/profile lookups.
   */
  static async getProfileByEmail(email: string) {
    try {
      const db = servicesContainer.getDatabaseService();
      const profileColl = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
      const profiles = await db.listDocuments(profileColl, { equals: { email: [email.toLowerCase().trim()] } });
      return profiles.total > 0 ? JSON.parse(JSON.stringify(profiles.documents[0])) : null;
    } catch (error) {
      console.error("Failed to fetch profile by email:", error);
      return null;
    }
  }

  /**
   * Used in StudentController.getProfile (GET /api/student/profile/:profileId)
   */
  static async getStudentProfile(profileId: string) {
    try {
      const db = servicesContainer.getDatabaseService();
      const profileColl = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
      const academicsColl = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!;
      const profile = await db.getDocument(profileColl, profileId);

      let academics = null;
      try {
        const acadList = await db.listDocuments(academicsColl, { equals: { studentId: [profileId] } });
        if (acadList.total > 0) {
          academics = acadList.documents[0];
        }
      } catch (e) {
        console.log("Academics collection might not be set up yet.");
      }

      return {
        profile: JSON.parse(JSON.stringify(profile)),
        academics: academics ? JSON.parse(JSON.stringify(academics)) : null,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }

  /**
   * Used in PortalService.createStudentProfile (invoked by POST /api/portal/action)
   */
  static async createStudentProfile(studentData: any) {
    try {
      const db = servicesContainer.getDatabaseService();
      const profileColl = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
      const newProfile = await db.createDocument(profileColl, {
          fullName: studentData.fullName,
          email: studentData.email,
          role: "mentee",
          department: studentData.department,
          rollNo: studentData.rollNumber,
          phone: studentData.phone,
          bio: "",
          isVerified: false,
          skills: [],
        }
      );
      return { success: true, profileId: (newProfile as any).$id };
    } catch (error: any) {
      console.error("Error creating profile:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Used in StudentController.updateProfile (PUT /api/student/profile/:profileId)
   */
  static async updateProfileDetails(profileId: string, department: string, skillsString: string) {
    try {
      const validatedData = ProfileUpdateSchema.safeParse({
        department: department,
        skills: skillsString,
      });

      if (!validatedData.success) {
        return {
          success: false,
          error: validatedData.error.issues[0]?.message || "Invalid input provided.",
        };
      }

      const validDepartment = validatedData.data.department;
      const validSkills = validatedData.data.skills;

      const db = servicesContainer.getDatabaseService();
      const profileColl = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
      const skillsArray = validSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

      await db.updateDocument(profileColl, profileId, {
          department: validDepartment,
          skills: skillsArray,
        }
      );

      return { success: true };
    } catch (error: any) {
      console.error("Profile update failed:", error);
      return { success: false, error: "A server error occurred. Please try again." };
    }
  }

  /**
   * Used in StudentController.getMenteeProfile (GET /api/student/mentee/:userId)
   */
  static async getMenteeProfile(userId: string) {
    try {
      const db = servicesContainer.getDatabaseService();
      const profileColl = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
      const profile = await db.getDocument(profileColl, userId);
      return JSON.parse(JSON.stringify(profile));
    } catch (error) {
      console.error("Failed to fetch student profile:", error);
      return null;
    }
  }

  /**
   * Used in StudentController.getLatestAcademic (GET /api/student/academics/latest/:studentId)
   */
  static async getLatestAcademicRecord(studentId: string) {
    try {
      const db = servicesContainer.getDatabaseService();
      const academicsColl = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!;
      const academicsRes = await db.listDocuments(academicsColl, {
          equals: { studentId: [studentId] },
          orderByDesc: "$createdAt",
          limit: 1,
      });
      return academicsRes.documents.length > 0 ? JSON.parse(JSON.stringify(academicsRes.documents[0])) : null;
    } catch (error) {
      console.error("Failed to fetch latest academic record:", error);
      return null;
    }
  }

  /**
   * Used in StudentController.getAcademicRecords (GET /api/student/academics/:studentId)
   */
  static async getAcademicRecordsForProfile(studentId: string) {
    try {
      const db = servicesContainer.getDatabaseService();
      const academicsColl = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!;
      const academicsRes = await db.listDocuments(academicsColl, {
          equals: { studentId: [studentId] },
          orderByDesc: "$createdAt",
      });
      return JSON.parse(JSON.stringify(academicsRes.documents));
    } catch (error) {
      console.error("Failed to fetch academic records:", error);
      return [];
    }
  }

  /**
   * Used in StudentController.getAchievementRecords (GET /api/student/achievements/:studentId)
   */
  static async getAchievementRecordsForProfile(studentId: string) {
    try {
      const db = servicesContainer.getDatabaseService();
      const achievementsColl = process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!;
      const achievementsRes = await db.listDocuments(achievementsColl, {
        equals: { studentId: [studentId] },
        orderByDesc: "$createdAt",
      });
      return JSON.parse(JSON.stringify(achievementsRes.documents));
    } catch (error) {
      console.error("Failed to fetch achievement records:", error);
      return [];
    }
  }
}
