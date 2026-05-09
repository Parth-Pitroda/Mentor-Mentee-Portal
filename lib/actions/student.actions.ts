"use server";

import { databases } from "@/lib/appwrite/config";
import { revalidatePath } from "next/cache";
import { Client, Databases, Storage, ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file"; 


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
// 10. Log a Meeting (Secure Server Action)
// ==========================================
export async function logMeeting(data: { 
  studentId: string, 
  date: string, 
  topic: string, 
  mentorName: string, 
  description: string 
}) {
  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;

    await databases.createDocument(
      DATABASE_ID,
      MEETINGS_COLLECTION,
      ID.unique(),
      {
        studentId: data.studentId,
        date: data.date,
        topic: data.topic,
        mentorName: data.mentorName,
        description: data.description,
        status: "Pending" // Defaults to Pending until Mentor verifies
      }
    );

    // Refresh the page data automatically
    revalidatePath(`/dashboard/${data.studentId}/meetings`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to log meeting:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 11. Update Meeting Status (Mentor Action)
// ==========================================
export async function updateMeetingStatus(meetingId: string, newStatus: "Verified" | "Rejected", studentId: string) {
  try {
    // 1. Initialize an ADMIN Client to bypass document ownership rules
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!); // This gives the server permission to edit ANY document

    const adminDatabases = new Databases(adminClient);

    // 2. Perform the update using the Admin privileges
    await adminDatabases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      meetingId,
      { status: newStatus }
    );

    // 3. Clear Next.js cache for all relevant pages so the badge updates instantly
    revalidatePath(`/mentor-dashboard`);
    revalidatePath(`/dashboard/${studentId}/meetings`);
    revalidatePath(`/dashboard/${studentId}`); 
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update meeting status:", error);
    return { success: false, error: error.message };
  }
}


// ... (Keep all your existing functions) ...

// ==========================================
// 12. Upload Academic Record & File (Mentee)
// ==========================================
export async function uploadAcademicRecord(formData: FormData, studentId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const storage = new Storage(adminClient);
    const databases = new Databases(adminClient);

    const semester = formData.get("semester") as string;
    const spi = formData.get("spi") as string;
    const cpi = formData.get("cpi") as string;
    const file = formData.get("file") as File;

    // 2. THE FIX: Convert the Web File into a Node Buffer for Appwrite
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const appwriteInputFile = InputFile.fromBuffer(buffer, file.name);

    // 3. Upload using the new buffer
    const uploadedFile = await storage.createFile(
      process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
      ID.unique(),
      appwriteInputFile // <-- Use the converted file here!
    );

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
      ID.unique(),
      {
        studentId,
        semester: semester,
        spi: spi,
        cpi: cpi,
        fileId: uploadedFile.$id,
        status: "Pending"
      }
    );

    revalidatePath(`/dashboard/${studentId}/academics`);
    return { success: true };
  } catch (error: any) {
    console.error("Upload failed:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 13. Verify/Reject Academic Record (Mentor)
// ==========================================
export async function updateAcademicStatus(recordId: string, newStatus: "Verified" | "Rejected", studentId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
      recordId,
      { status: newStatus }
    );

    revalidatePath(`/dashboard/${studentId}/academics`);
    return { success: true };
  } catch (error: any) {
    console.error("Verification failed:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 14. Upload Achievement (Mentee)
// ==========================================
export async function uploadAchievement(formData: FormData, studentId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const storage = new Storage(adminClient);
    const databases = new Databases(adminClient);

    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File | null;

    let fileId = null;

    // Only upload to storage if a proof file was actually attached
    if (file && file.size > 0 && file.name !== "undefined") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const appwriteInputFile = InputFile.fromBuffer(buffer, file.name);

      const uploadedFile = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
        ID.unique(),
        appwriteInputFile
      );
      fileId = uploadedFile.$id;
    }

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
      ID.unique(),
      {
        studentId,
        title,
        category,
        description,
        fileId,
        status: "Pending"
      }
    );

    revalidatePath(`/dashboard/${studentId}/achievements`);
    return { success: true };
  } catch (error: any) {
    console.error("Achievement upload failed:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 15. Verify/Reject Achievement (Mentor)
// ==========================================
export async function updateAchievementStatus(achievementId: string, newStatus: "Verified" | "Rejected", studentId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
      achievementId,
      { status: newStatus }
    );

    revalidatePath(`/dashboard/${studentId}/achievements`);
    return { success: true };
  } catch (error: any) {
    console.error("Achievement verification failed:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 16. Update Profile Details (Mentee)
// ==========================================
export async function updateProfileDetails(profileId: string, department: string, skillsString: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // Convert comma-separated string "React, Node, Python" into an array ["React", "Node", "Python"]
    const skillsArray = skillsString
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== ""); // Remove any accidental empty strings

    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      profileId,
      { 
        department: department,
        skills: skillsArray 
      }
    );

    revalidatePath(`/dashboard/${profileId}/profile`);
    revalidatePath(`/dashboard/${profileId}`); // Also update the overview page!
    
    return { success: true };
  } catch (error: any) {
    console.error("Profile update failed:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 17. Assign Mentor to Student (Admin Action)
// ==========================================
export async function assignMentor(studentId: string, mentorId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // Update the student's profile with the new mentorId
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      studentId,
      { mentorId: mentorId }
    );

    revalidatePath(`/admin-dashboard`);
    return { success: true };
  } catch (error: any) {
    console.error("Assignment failed:", error);
    return { success: false, error: error.message };
  }
}