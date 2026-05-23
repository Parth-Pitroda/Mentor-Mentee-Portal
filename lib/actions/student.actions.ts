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

// ==========================================
// 22. Get System Analytics (Admin Dashboard)
// ==========================================
export async function getSystemAnalytics() {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    // We use Promise.all to fetch all the counts simultaneously for maximum speed!
    const [mentees, verifiedMentees, meetings] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        [Query.equal("role", ["mentee"])]
      ),
      databases.listDocuments(
        DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        [Query.equal("role", ["mentee"]), Query.equal("isVerified", [true])]
      ),
      databases.listDocuments(
        DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!
      )
    ]);

    return {
      totalStudents: mentees.total,
      verifiedStudents: verifiedMentees.total,
      pendingVerifications: mentees.total - verifiedMentees.total,
      totalMeetings: meetings.total
    };
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return { totalStudents: 0, verifiedStudents: 0, pendingVerifications: 0, totalMeetings: 0 };
  }
}

// ==========================================
// 23. Create Global Notice (Admin)
// ==========================================
export async function createGlobalNotice(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID!, 
      ID.unique(),
      { title, content }
    );

    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to post notice:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 24. Fetch All Mentors (Admin)
// ==========================================
export async function getAllMentors() {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    const mentors = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.equal("role", ["mentor"]), Query.orderDesc("$createdAt")]
    );

    return JSON.parse(JSON.stringify(mentors.documents));
  } catch (error) {
    console.error("Failed to fetch mentors:", error);
    return [];
  }
}

// ==========================================
// 25. Get Verified Data for Export (Admin)
// ==========================================
export async function getVerifiedStudentsForExport() {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    const students = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.equal("role", ["mentee"]), Query.equal("isVerified", [true])]
    );

    // We only return the specific fields we want the University office to see
    const cleanData = students.documents.map((student) => ({
      FullName: student.fullName,
      RollNumber: student.rollNo || "N/A",
      Email: student.email,
      Department: student.department,
      CurrentSemester: student.currentSemester || "N/A"
    }));

    return JSON.parse(JSON.stringify(cleanData));
  } catch (error) {
    console.error("Export failed:", error);
    return [];
  }
}

// ==========================================
// 26. Fetch ALL Users for Management (Admin)
// ==========================================
export async function getAllProfiles() {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    const profiles = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.orderDesc("$createdAt")] // Gets everyone!
    );

    return JSON.parse(JSON.stringify(profiles.documents));
  } catch (error) {
    console.error("Failed to fetch all profiles:", error);
    return [];
  }
}

// ==========================================
// 27. Delete User Profile (Admin Action)
// ==========================================
export async function deleteUserProfile(profileId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // Completely remove the profile from the database
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      profileId
    );

    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete profile:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 28. Get Global Settings (Admin)
// ==========================================
export async function getGlobalSettings() {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);
    const SETTINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!;

    const settingsList = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      SETTINGS_COLLECTION,
      [Query.limit(1)] // We only ever need the single master settings document
    );

    // If no settings exist yet, create a default one automatically!
    if (settingsList.total === 0) {
      const defaultSettings = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        SETTINGS_COLLECTION,
        ID.unique(),
        { activeTerm: "Odd Semesters (July-Dec)", academicYear: "2026-2027" }
      );
      return JSON.parse(JSON.stringify(defaultSettings));
    }

    return JSON.parse(JSON.stringify(settingsList.documents[0]));
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return null;
  }
}

// ==========================================
// 29. Update Global Settings (Admin)
// ==========================================
export async function updateGlobalSettings(settingsId: string, formData: FormData) {
  try {
    const activeTerm = formData.get("activeTerm") as string;
    const academicYear = formData.get("academicYear") as string;

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
      settingsId,
      { activeTerm, academicYear }
    );

    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 30. Get Department Analytics (Admin)
// ==========================================
export async function getDepartmentAnalytics() {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // Fetch all mentees
    const profiles = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.equal("role", ["mentee"])]
    );

    // Group the data by department
    const deptStats: Record<string, { total: number; verified: number }> = {};

    profiles.documents.forEach((student) => {
      const dept = student.department || "Unassigned";
      
      if (!deptStats[dept]) {
        deptStats[dept] = { total: 0, verified: 0 };
      }
      
      deptStats[dept].total += 1;
      if (student.isVerified) {
        deptStats[dept].verified += 1;
      }
    });

    // Format the data specifically for our Chart library
    const chartData = Object.keys(deptStats).map((dept) => ({
      name: dept,
      Total: deptStats[dept].total,
      Verified: deptStats[dept].verified,
    }));

    return chartData;
  } catch (error) {
    console.error("Failed to fetch department analytics:", error);
    return [];
  }
}

// ==========================================
// 31. Get Unassigned Students (Admin)
// ==========================================
export async function getUnassignedStudents() {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // Fetch all mentees
    const mentees = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.equal("role", ["mentee"]), Query.orderDesc("$createdAt")]
    );

    // Filter to only return students who do NOT have a mentorId
    const unassigned = mentees.documents.filter(
      (student) => !student.mentorId || student.mentorId === ""
    );

    return JSON.parse(JSON.stringify(unassigned));
  } catch (error) {
    console.error("Failed to fetch unassigned students:", error);
    return [];
  }
}

// ==========================================
// 32. Assign Mentor to Student (Admin)
// ==========================================
export async function assignMentorToStudent(studentId: string, formData: FormData) {
  try {
    const mentorId = formData.get("mentorId") as string;
    
    if (!mentorId) throw new Error("Please select a mentor.");

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
      { 
        mentorId: mentorId,
        isVerified: true
      }
    );

    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to assign mentor:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 33. Bulk Import Students from CSV (Admin)
// ==========================================
export async function importStudentsFromCSV(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) throw new Error("Please select a valid CSV file.");

    // Read the file content as text
    const text = await file.text();
    
    // Split the text into an array of lines, ignoring empty rows
    const lines = text.split("\n").filter(line => line.trim() !== "");

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // Loop through all lines EXCEPT the first one (which contains the headers)
    for (let i = 1; i < lines.length; i++) {
      // Split each row by commas: [FullName, Email, Department]
      const [fullName, email, department] = lines[i].split(",").map(item => item.trim());

      // Skip invalid rows
      if (!fullName || !email) continue;

      // Create the student document in Appwrite
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!, // Ensure this matches your collection ID variable
        ID.unique(),
        {
          fullName: fullName,
          email: email,
          department: department || "Unassigned",
          role: "mentee",
          isVerified: true, // Automatically verify students imported by the Admin
        }
      );
    }

    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to import CSV:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 34. Get System Activity Logs (Admin)
// ==========================================
export async function getSystemActivityLog() {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    // 1. Fetch latest notices
    const noticesList = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_NOTICES_ID!, // Ensure this matches your notices collection ID
      [Query.orderDesc("$createdAt"), Query.limit(3)]
    );

    // 2. Fetch latest student profiles
    const profilesList = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.orderDesc("$createdAt"), Query.limit(4)]
    );

    // 3. Format and merge them into a single timeline array
    const logs: any[] = [];

    noticesList.documents.forEach((notice) => {
      logs.push({
        id: notice.$id,
        type: "notice",
        message: `Global Notice published: "${notice.title}"`,
        timestamp: new Date(notice.$createdAt),
        icon: "📢",
        color: "bg-blue-100 text-blue-600"
      });
    });

    profilesList.documents.forEach((profile) => {
      logs.push({
        id: profile.$id,
        type: "user",
        message: profile.mentorId 
          ? `${profile.fullName} was assigned a mentor.` 
          : `New student account created: ${profile.fullName}`,
        timestamp: new Date(profile.$createdAt),
        icon: profile.mentorId ? "🤝" : "👤",
        color: profile.mentorId ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"
      });
    });

    // Sort the combined logs from newest to oldest
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Return the top 5 most recent activities
    return JSON.parse(JSON.stringify(logs.slice(0, 5)));
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return [];
  }
}
// ==========================================
// 35. Get Mentor's Specific Roster
// ==========================================
export async function getMentorRoster(mentorId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

    const mentees = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [
        Query.equal("role", ["mentee"]),
        Query.equal("mentorId", mentorId), // Only fetch students assigned to THIS mentor
        Query.orderDesc("$createdAt"),
        Query.limit(100) // 🚨 ADDED THIS LINE: Forces Appwrite to send up to 100 students!
      ]
    );

    return JSON.parse(JSON.stringify(mentees.documents));
  } catch (error) {
    console.error("Failed to fetch mentor roster:", error);
    return [];
  }
}

// ==========================================
// 36. Complete Mentee Onboarding (With Profile Pic)
// ==========================================
export async function completeMenteeOnboarding(userId: string, formData: FormData) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);
    const storage = new Storage(adminClient); // Need the storage service!

    let profilePictureId = null;

    // 1. Process and upload the image if it exists
    const file = formData.get("profilePicture") as File | null;
    if (file && file.size > 0 && file.name !== "undefined") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const appwriteInputFile = InputFile.fromBuffer(buffer, file.name);

      const uploadedFile = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
        ID.unique(),
        appwriteInputFile
      );
      profilePictureId = uploadedFile.$id;
    }

    // 2. Package the text data
    const updateData: any = {
      department: formData.get("department"),
      phone: formData.get("phone"),
      bloodGroup: formData.get("bloodGroup"),
      residentialStatus: formData.get("residentialStatus"),
      semester: formData.get("semester"),
      cgpa: formData.get("cgpa"),
      backlogs: formData.get("backlogs"),
      interests: formData.get("interests"),
      fatherName: formData.get("fatherName"),
      fatherOccupation: formData.get("fatherOccupation"),
      fatherPhone: formData.get("fatherPhone"),
      fatherEmail: formData.get("fatherEmail"),
      motherName: formData.get("motherName"),
      motherOccupation: formData.get("motherOccupation"),
      motherPhone: formData.get("motherPhone"),
      motherEmail: formData.get("motherEmail"),
    };

    // 3. Add the picture ID if we successfully uploaded one
    if (profilePictureId) {
      updateData.profilePictureId = profilePictureId;
    }

    // 4. Save to the database
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      userId,
      updateData
    );

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save onboarding data:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 37. Get Full Student Profile
// ==========================================
export async function getMenteeProfile(userId: string) {
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);

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

// ==========================================
// 38. Exact-Match Advisory Import (Admin)
// ==========================================
export async function importMasterAdvisoryList(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) throw new Error("Please select a valid CSV file.");

    const text = await file.text();
    const lines = text.split(/\r?\n/); // Split by row

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);
    const users = new Users(adminClient);

    // 1. Fetch all Mentors currently in the database to match against
    const mentorsResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.equal("role", ["mentor"])]
    );
    const allMentors = mentorsResponse.documents;

    let successCount = 0;
    let errors: string[] = [];

    // Start at i = 1 to skip the Header row!
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Smart split that ignores commas wrapped inside quotes
      const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').trim());
      
      const fullName = cols[1]; 
      const rollNo = cols[2];   
      const facultyName = cols[5]; // Column F in your clean CSV

      // 🚨 ADD THIS DIAGNOSTIC BLOCK 🚨
      if (i === 1) {
        console.log("=== DIAGNOSTIC ROW 1 ===");
        console.log("Raw text from file:", line);
        console.log("How the code split it:", cols);
        console.log(`Name found: '${fullName}', Roll No found: '${rollNo}'`);
      }

      if (!fullName || !rollNo) continue;

      // === THE INTELLIGENT MATCHING LOGIC ===
      let currentFacultyId = "unassigned_mentor"; // Default fallback

      if (facultyName && facultyName !== "") {
        // Clean prefixes to ensure solid matching (removes "Dr.", "Prof.", etc.)
        const cleanCsvName = facultyName.toLowerCase().replace(/(dr\.|prof\.)?\s*/g, '').trim();
        
        // Find the mentor in the database
        const matchedMentor = allMentors.find(m => {
          const cleanDbName = m.fullName.toLowerCase().replace(/(dr\.|prof\.)?\s*/g, '').trim();
          return cleanDbName.includes(cleanCsvName) || cleanCsvName.includes(cleanDbName);
        });

        // If we found them, grab their ID!
        if (matchedMentor) {
          currentFacultyId = matchedMentor.$id;
        } else {
          // If the teacher isn't in the DB yet, we warn you but still import the student
          errors.push(`Row ${i + 1} (${rollNo}): Mentor '${facultyName}' not found in database. Student marked as Unassigned.`);
        }
      }

      // === THE EMAIL GENERATOR ===
      const cleanRollNo = rollNo.toLowerCase().replace(/\s+/g, '');
      const generatedEmail = `${cleanRollNo}@sot.pdpu.ac.in`;

      try {
        // Step A: Create Auth Account
        try {
          await users.create(
            ID.unique(),
            generatedEmail,
            undefined,
            `Pdeu@${cleanRollNo}`, 
            fullName
          );
        } catch (authError: any) {
          if (authError.code !== 409) throw authError; 
        }

        // Step B: Create Database Profile WITH the mapped Faculty ID
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
          ID.unique(),
          {
            fullName: fullName,
            email: generatedEmail,
            rollNo: rollNo.toUpperCase(),
            department: "Unassigned", 
            role: "mentee",
            isVerified: true,
            mentorId: currentFacultyId // Exactly what the college assigned!
          }
        );
        
        successCount++;
      } catch (err: any) {
        if (err.code === 409) {
          errors.push(`Row ${i + 1} (${rollNo}): Student already exists.`);
        } else {
          errors.push(`Row ${i + 1} (${rollNo}): ${err.message}`);
        }
      }
    }

    console.log("=== MAPPED IMPORT RESULTS ===");
    console.log(`Successfully imported: ${successCount} students.`);
    console.log(`Errors / Unmatched Mentors:`, errors);

    revalidatePath("/admin-dashboard");
    return { success: true, count: successCount, errors };

  } catch (error: any) {
    console.error("Master Import Failed:", error);
    return { success: false, error: error.message };
  }
}