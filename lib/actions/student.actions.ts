"use server";

import { databases } from "@/lib/appwrite/config";
import { revalidatePath } from "next/cache";
import { InputFile } from "node-appwrite/file";
import { Client, Databases, ID, Query, Storage, Users } from "node-appwrite";
import { ProfileUpdateSchema } from "@/lib/validation/schema";


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
    const validatedData = ProfileUpdateSchema.safeParse({
      department: department,
      skills: skillsString
    });

    if (!validatedData.success) {
      return { 
        success: false, 
        error: validatedData.error.issues[0]?.message || "Invalid input provided." 
      };
    }

    // Explicitly extract the data so TypeScript stops complaining!
    const validDepartment = validatedData.data.department;
    const validSkills = validatedData.data.skills;

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

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
        skills: skillsArray 
      }
    );

    revalidatePath(`/dashboard/${profileId}/profile`);
    revalidatePath(`/dashboard/${profileId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Profile update failed:", error);
    return { success: false, error: "A server error occurred. Please try again." };
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

// ==========================================
// 18. Bulk CSV Import Engine (Admin)
// ==========================================
export async function bulkImportStudents(studentList: Array<{ fullName: string, email: string, department: string }>) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);
    const users = new Users(adminClient);

    let successCount = 0;
    let errors = [];

    // Process sequentially to respect API rate limits
    for (const student of studentList) {
      try {
        const emailLower = student.email.toLowerCase().trim();

        // 1. Create Appwrite Auth Account (with a standardized default password)
        // In a real production app, you might trigger a password reset email here instead
        const authUser = await users.create(
          ID.unique(),
          emailLower,
          undefined, // phone
          "Pdeu@2026", // Default password for all imported users
          student.fullName.trim()
        );

        // 2. Create the Database Profile
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
          ID.unique(),
          {
            email: emailLower,
            fullName: student.fullName.trim(),
            department: student.department.trim(),
            role: "mentee",
            isVerified: true // Auto-verify since an admin uploaded them
          }
        );

        successCount++;
      } catch (err: any) {
        // If a single user fails (e.g. email already exists), we catch the error 
        // but KEEP processing the rest of the CSV!
        errors.push(`Failed for ${student.email}: ${err.message}`);
      }
    }

    revalidatePath(`/admin-dashboard`);
    return { success: true, successCount, errors };
  } catch (error: any) {
    console.error("Bulk import failed critically:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 19. Fetch Assigned Mentees (For Mentor Dashboard)
// ==========================================
export async function getAssignedMentees(mentorId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // Query the profiles collection to find all students who have this mentor's ID
    const rosterList = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [
        Query.equal("mentorId", [mentorId]),
        Query.equal("role", ["mentee"]),
        Query.orderDesc("$createdAt")
      ]
    );

    return JSON.parse(JSON.stringify(rosterList.documents));
  } catch (error) {
    console.error("Failed to fetch mentor roster:", error);
    return [];
  }
}

// ==========================================
// 20. Fetch Pending Approvals (For Mentor Dashboard)
// ==========================================
// ==========================================
// 20. Fetch ALL Pending Approvals (Meetings, Academics, Achievements)
// ==========================================
export async function getPendingApprovals(mentorId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // 1. Get all mentees assigned to this mentor
    const menteesList = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.equal("mentorId", [mentorId])]
    );

    if (menteesList.total === 0) return { meetings: [], academics: [], achievements: [] };

    // 2. Map their IDs and Names so we know WHO submitted the request
    const menteeIds: string[] = [];
    const studentMap: Record<string, string> = {};
    
    menteesList.documents.forEach((doc) => {
      menteeIds.push(doc.$id);
      studentMap[doc.$id] = doc.fullName;
    });

    // 3. Fetch ALL pending requests across all three collections simultaneously using Promise.all
    const [pendingMeetings, pendingAcademics, pendingAchievements] = await Promise.all([
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt")]
      ),
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
        [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt")]
      ),
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
        [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt")]
      )
    ]);

    // 4. Attach the student's name to the requests
    const mapWithNames = (docs: any[]) => docs.map(doc => ({
      ...doc,
      studentName: studentMap[doc.studentId] || "Unknown Student"
    }));

    return JSON.parse(JSON.stringify({ 
      meetings: mapWithNames(pendingMeetings.documents),
      academics: mapWithNames(pendingAcademics.documents),
      achievements: mapWithNames(pendingAchievements.documents)
    }));

  } catch (error) {
    console.error("Failed to fetch pending approvals:", error);
    return { meetings: [], academics: [], achievements: [] };
  }
}

// ==========================================
// 21. Master Verification Toggle
// ==========================================

export async function toggleStudentVerification(studentId: string, currentStatus: boolean) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // Flip the status to the opposite of what it currently is
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      studentId,
      {
        isVerified: !currentStatus
      }
    );

    // Tell Next.js to refresh the mentor pages so the UI updates instantly
    revalidatePath("/mentor-dashboard");
    revalidatePath(`/mentor-dashboard/student/${studentId}`);
    
    return JSON.parse(JSON.stringify({ success: true }));
  } catch (error: any) {
    console.error("Failed to toggle verification:", error);
    return JSON.parse(JSON.stringify({ error: error.message }));
  }
}