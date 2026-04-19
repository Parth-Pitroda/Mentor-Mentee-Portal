"use server";

import { databases } from "@/lib/appwrite/config";
import { ID, Query } from "appwrite";
import { revalidatePath } from "next/cache";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

// ==========================================
// 1. Fetch a Single Student (For Mentee Dashboard)
// ==========================================
export async function getStudentProfile(profileId: string) {
  try {
    const profile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileId);
    
    let academics = null;
    try {
      const ACADEMICS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!;
      const acadList = await databases.listDocuments(
        DATABASE_ID, 
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
      academics: academics ? JSON.parse(JSON.stringify(academics)) : null 
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

// ==========================================
// 2. Create a Student Profile (Onboarding)
// ==========================================
export async function createStudentProfile(studentData: any) {
  try {
    const newProfile = await databases.createDocument(
      DATABASE_ID,
      PROFILES_COLLECTION,
      ID.unique(),
      {
        fullName: studentData.fullName,
        email: studentData.email,
        role: "mentee",
        department: studentData.department,
        bio: `Roll No: ${studentData.rollNumber} | Phone: ${studentData.phone}`,
        isVerified: false,
        skills: [], 
      }
    );
    return JSON.parse(JSON.stringify({ success: true, profileId: newProfile.$id }));
  } catch (error: any) {
    console.error("Error creating profile:", error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

// ==========================================
// 3. Notice Board
// ==========================================
export async function getLatestNotices(limit = 5) {
  try {
    const NOTICES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID!; 

    const notices = await databases.listDocuments(
      DATABASE_ID,
      NOTICES_COLLECTION,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(limit)
      ]
    );
    return JSON.parse(JSON.stringify(notices.documents));
  } catch (error) {
    console.error("Failed to fetch notices:", error);
    return [];
  }
}

// ==========================================
// 4. Fetch All Students (For Mentor Dashboard)
// ==========================================
export async function getAllStudents() {
  try {
    const students = await databases.listDocuments(
      DATABASE_ID,
      PROFILES_COLLECTION,
      [
        Query.equal("role", ["mentee"]),
        Query.orderDesc("$createdAt")
      ]
    );
    return JSON.parse(JSON.stringify(students.documents));
  } catch (error) {
    console.error("Failed to fetch all students:", error);
    return [];
  }
}

// ==========================================
// 5. Toggle Student Verification (Mentor Action)
// ==========================================
export async function toggleStudentVerification(studentId: string, currentStatus: boolean) {
  try {
    // Flip the status to the opposite of whatever it currently is
    await databases.updateDocument(
      DATABASE_ID,
      PROFILES_COLLECTION,
      studentId,
      {
        isVerified: !currentStatus 
      }
    );

    // Tell Next.js to clear its cache and instantly refresh the mentor dashboard!
    revalidatePath("/mentor-dashboard");
    
    return JSON.parse(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("Failed to toggle verification:", error);
    return JSON.parse(JSON.stringify({ success: false }));
  }
}
// ==========================================
// 6. Fetch Achievements
// ==========================================
export async function getAchievements(studentId: string) {
  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const ACHIEVEMENTS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!;

    const result = await databases.listDocuments(
      DATABASE_ID,
      ACHIEVEMENTS_COLLECTION,
      [
        Query.equal("studentId", [studentId]),
        Query.orderDesc("$createdAt")
      ]
    );
    return JSON.parse(JSON.stringify(result.documents));
  } catch (error) {
    console.error("Failed to fetch achievements:", error);
    return [];
  }
}

// ==========================================
// 7. Add Achievement
// ==========================================
export async function addAchievement(studentId: string, title: string, category: string) {
  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const ACHIEVEMENTS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!;

    await databases.createDocument(
      DATABASE_ID,
      ACHIEVEMENTS_COLLECTION,
      ID.unique(),
      {
        studentId,
        title,
        category
      }
    );

    // Refresh the dashboard to show the new achievement instantly
    revalidatePath(`/dashboard/${studentId}`);
    return JSON.parse(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("Failed to add achievement:", error);
    return JSON.parse(JSON.stringify({ success: false }));
  }
}

// ==========================================
// 8. Save Academics (Create or Update)
// ==========================================
export async function saveAcademics(studentId: string, year: string, gpa: number, documentId?: string) {
  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const ACADEMICS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!;

    // If they already have a record, update it. If not, create a new one!
    if (documentId) {
      await databases.updateDocument(DATABASE_ID, ACADEMICS_COLLECTION, documentId, { year, gpa });
    } else {
      await databases.createDocument(DATABASE_ID, ACADEMICS_COLLECTION, ID.unique(), { studentId, year, gpa });
    }

    revalidatePath(`/dashboard/${studentId}`);
    return JSON.parse(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("Failed to save academics:", error);
    return JSON.parse(JSON.stringify({ success: false }));
  }
}

// ==========================================
// 9. Fetch Meetings
// ==========================================
export async function getMeetings(studentId: string) {
  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;

    const result = await databases.listDocuments(
      DATABASE_ID,
      MEETINGS_COLLECTION,
      [
        Query.equal("studentId", [studentId]),
        Query.orderDesc("date") // Sort by newest date first
      ]
    );
    return JSON.parse(JSON.stringify(result.documents));
  } catch (error) {
    console.error("Failed to fetch meetings:", error);
    return [];
  }
}

// ==========================================
// 10. Log a Meeting
// ==========================================
export async function logMeeting(studentId: string, date: string, topic: string) {
  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;

    await databases.createDocument(
      DATABASE_ID,
      MEETINGS_COLLECTION,
      ID.unique(),
      {
        studentId,
        date,
        topic
      }
    );

    revalidatePath(`/dashboard/${studentId}`);
    return JSON.parse(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("Failed to log meeting:", error);
    return JSON.parse(JSON.stringify({ success: false }));
  }
}