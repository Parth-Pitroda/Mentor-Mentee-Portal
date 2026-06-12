import { Databases, ID, Query } from "node-appwrite";
import { createAdminClient } from "../../app";
import { ProfileUpdateSchema } from "../validators/updateProfile";

export class StudentService {
  private static getAdminDatabases() {
    return new Databases(createAdminClient());
  }

  static async getProfileByEmail(email: string) {
    try {
      const databases = this.getAdminDatabases();
      const profiles = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        [Query.equal("email", [email.toLowerCase().trim()])]
      );
      return profiles.total > 0 ? JSON.parse(JSON.stringify(profiles.documents[0])) : null;
    } catch (error) {
      console.error("Failed to fetch profile by email:", error);
      return null;
    }
  }

  static async getStudentProfile(profileId: string) {
    try {
      const databases = this.getAdminDatabases();
      const profile = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        profileId
      );

      let academics = null;
      try {
        const ACADEMICS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!;
        const acadList = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          ACADEMICS_COLLECTION,
          [Query.equal("studentId", [profileId])]
        );
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

  static async createStudentProfile(studentData: any) {
    try {
      const databases = this.getAdminDatabases();
      const newProfile = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        ID.unique(),
        {
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
      return { success: true, profileId: newProfile.$id };
    } catch (error: any) {
      console.error("Error creating profile:", error);
      return { success: false, error: error.message };
    }
  }

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

      const databases = this.getAdminDatabases();
      const skillsArray = validSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        profileId,
        {
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

  static async getMenteeProfile(userId: string) {
    try {
      const databases = this.getAdminDatabases();
      const profile = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        userId
      );
      return JSON.parse(JSON.stringify(profile));
    } catch (error) {
      console.error("Failed to fetch student profile:", error);
      return null;
    }
  }

  static async getLatestAcademicRecord(studentId: string) {
    try {
      const databases = this.getAdminDatabases();
      const academicsRes = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
        [
          Query.equal("studentId", studentId),
          Query.orderDesc("$createdAt"),
          Query.limit(1),
        ]
      );
      return academicsRes.documents.length > 0 ? JSON.parse(JSON.stringify(academicsRes.documents[0])) : null;
    } catch (error) {
      console.error("Failed to fetch latest academic record:", error);
      return null;
    }
  }

  static async getAcademicRecordsForProfile(studentId: string) {
    try {
      const databases = this.getAdminDatabases();
      const academicsRes = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
        [
          Query.equal("studentId", studentId),
          Query.orderDesc("$createdAt"),
        ]
      );
      return JSON.parse(JSON.stringify(academicsRes.documents));
    } catch (error) {
      console.error("Failed to fetch academic records:", error);
      return [];
    }
  }

  static async getAchievementRecordsForProfile(studentId: string) {
    try {
      const databases = this.getAdminDatabases();
      const achievementsRes = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
        [
          Query.equal("studentId", studentId),
          Query.orderDesc("$createdAt"),
        ]
      );
      return JSON.parse(JSON.stringify(achievementsRes.documents));
    } catch (error) {
      console.error("Failed to fetch achievement records:", error);
      return [];
    }
  }
}
