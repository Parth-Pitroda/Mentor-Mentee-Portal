"use server";

import { databases } from "@/lib/appwrite/config";
import { revalidatePath } from "next/cache";
import { InputFile } from "node-appwrite/file";
import { Client, Databases, ID, Query, Storage, Users } from "node-appwrite";
import { ProfileUpdateSchema } from "@/lib/validation/schema";
import { getLoggedInUser } from "@/lib/actions/auth.actions";


const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
const MENTOR_SCHEDULED_MEETING_MARKER = "[Mentor Scheduled Meeting]";

type NotificationPayload = {
  $id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: string;
  timestamp: string;
  $createdAt?: string;
  isVirtual?: boolean;
};

type ActivityDocument = {
  $id: string;
  $createdAt?: string;
  studentId?: string;
  studentName?: string;
  topic?: string;
  date?: string;
  proposedDate?: string;
  proposedTime?: string;
  semester?: string | number;
  title?: string;
  category?: string;
  status?: string;
};

function createAdminDatabases() {
  const adminClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.NEXT_APPWRITE_KEY!);

  return new Databases(adminClient);
}

export async function getProfileByEmail(email: string) {
  try {
    const adminDatabases = createAdminDatabases();
    const profiles = await adminDatabases.listDocuments(
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

async function getCurrentProfileForUser(adminDatabases: Databases, email: string) {
  const profiles = await adminDatabases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
    [Query.equal("email", [email.toLowerCase().trim()]), Query.limit(1)]
  );

  return profiles.documents[0] || null;
}

type ProfileDocument = {
  $id: string;
  email?: string;
  role?: string;
  mentorId?: string;
  fullName?: string;
  [key: string]: unknown;
};

async function getCurrentProfileScope(adminDatabases: Databases) {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const profile = await getCurrentProfileForUser(adminDatabases, user.email) as ProfileDocument | null;
  if (!profile) {
    throw new Error("Your profile could not be found.");
  }

  return { user, profile };
}

async function requireCurrentRole(adminDatabases: Databases, allowedRoles: string[]) {
  const scope = await getCurrentProfileScope(adminDatabases);
  if (!allowedRoles.includes(scope.profile.role || "")) {
    throw new Error("You do not have permission to perform this action.");
  }

  return scope;
}

async function requireAdminOrCoordinator(adminDatabases: Databases) {
  return requireCurrentRole(adminDatabases, ["admin", "coordinator"]);
}

async function requireSelfProfile(adminDatabases: Databases, profileId: string) {
  const scope = await getCurrentProfileScope(adminDatabases);
  if (scope.profile.$id !== profileId && scope.user.$id !== profileId) {
    throw new Error("You can only update your own profile.");
  }

  return scope;
}

async function requireAssignedMentorForStudent(adminDatabases: Databases, studentId: string) {
  const scope = await requireCurrentRole(adminDatabases, ["mentor"]);
  const student = await adminDatabases.getDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
    studentId
  ) as ProfileDocument;

  if (student.mentorId !== scope.profile.$id && student.mentorId !== scope.user.$id) {
    throw new Error("Only the assigned mentor can perform this action.");
  }

  return { ...scope, student };
}

async function requireMentorScope(adminDatabases: Databases, mentorId: string) {
  const scope = await requireCurrentRole(adminDatabases, ["mentor"]);
  if (mentorId !== scope.profile.$id && mentorId !== scope.user.$id) {
    throw new Error("You can only access your own mentor workspace.");
  }

  return scope;
}

async function requireSelfOrAssignedMentor(adminDatabases: Databases, studentId: string) {
  const scope = await getCurrentProfileScope(adminDatabases);
  if (scope.profile.role === "admin" || scope.profile.role === "coordinator") {
    return scope;
  }

  if (scope.profile.$id === studentId || scope.user.$id === studentId) {
    return scope;
  }

  if (scope.profile.role === "mentor") {
    await requireAssignedMentorForStudent(adminDatabases, studentId);
    return scope;
  }

  throw new Error("You do not have permission to access this student.");
}

function validateUploadFile(file: File | null, options: { required: boolean; maxBytes: number; allowedTypes: string[] }) {
  if (!file || file.size === 0 || file.name === "undefined") {
    if (options.required) throw new Error("Please select a valid file.");
    return null;
  }

  if (file.size > options.maxBytes) {
    throw new Error(`File must be ${Math.floor(options.maxBytes / (1024 * 1024))}MB or smaller.`);
  }

  if (!options.allowedTypes.includes(file.type)) {
    throw new Error("Unsupported file type.");
  }

  return file;
}

function sortNotifications(notifications: NotificationPayload[]) {
  return notifications.sort((a, b) => {
    const aTime = new Date(a.timestamp || a.$createdAt || 0).getTime();
    const bTime = new Date(b.timestamp || b.$createdAt || 0).getTime();
    return bTime - aTime;
  });
}

function createActivityNotification({
  id,
  userId,
  message,
  type,
  relatedId,
  timestamp,
}: {
  id: string;
  userId: string;
  message: string;
  type: string;
  relatedId: string;
  timestamp?: string;
}): NotificationPayload {
  return {
    $id: `activity-${type}-${id}`,
    userId,
    message,
    type,
    relatedId,
    isRead: false,
    isVirtual: true,
    timestamp: timestamp || new Date().toISOString(),
  };
}

function mergeNotificationsWithActivity(notifications: NotificationPayload[], activity: NotificationPayload[]) {
  const seen = new Set<string>();

  const merged = [...notifications, ...activity].filter((notification) => {
    const key = `${notification.type}:${notification.relatedId || notification.$id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return sortNotifications(merged).slice(0, 25);
}

async function getMentorRecentActivity(adminDatabases: Databases, mentorIds: string[], feedUserId: string) {
  const menteesList = await adminDatabases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
    [Query.equal("mentorId", mentorIds), Query.limit(100)]
  );

  if (menteesList.total === 0) return [];

  const menteeIds: string[] = [];
  const studentMap: Record<string, string> = {};

  menteesList.documents.forEach((doc) => {
    menteeIds.push(doc.$id);
    studentMap[doc.$id] = doc.fullName || "A mentee";
  });

  const [meetingRequests, pendingMeetings, pendingAcademics, pendingAchievements] = await Promise.all([
    adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      [Query.equal("studentId", menteeIds), Query.equal("status", ["Requested"]), Query.orderDesc("$createdAt"), Query.limit(10)]
    ).catch(() => ({ documents: [] })),
    adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(10)]
    ).catch(() => ({ documents: [] })),
    adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
      [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(10)]
    ).catch(() => ({ documents: [] })),
    adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
      [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(10)]
    ).catch(() => ({ documents: [] })),
  ]);

  const activities: NotificationPayload[] = [];

  (meetingRequests.documents as ActivityDocument[]).forEach((request) => {
    const studentName = request.studentId ? studentMap[request.studentId] || "A mentee" : "A mentee";
    activities.push(createActivityNotification({
      id: request.$id,
      userId: feedUserId,
      type: "meeting_request_pending",
      relatedId: request.$id,
      timestamp: request.$createdAt,
      message: `${studentName} requested a meeting${request.proposedDate || request.date ? ` on ${request.proposedDate || request.date}` : ""}${request.proposedTime ? ` at ${request.proposedTime}` : ""}.`,
    }));
  });

  (pendingMeetings.documents as ActivityDocument[]).forEach((meeting) => {
    const studentName = meeting.studentId ? studentMap[meeting.studentId] || "A mentee" : "A mentee";
    activities.push(createActivityNotification({
      id: meeting.$id,
      userId: feedUserId,
      type: "meeting_log_submission",
      relatedId: meeting.$id,
      timestamp: meeting.$createdAt,
      message: `${studentName} submitted a meeting log${meeting.topic ? ` for "${meeting.topic}"` : ""}.`,
    }));
  });

  (pendingAcademics.documents as ActivityDocument[]).forEach((record) => {
    const studentName = record.studentId ? studentMap[record.studentId] || "A mentee" : "A mentee";
    activities.push(createActivityNotification({
      id: record.$id,
      userId: feedUserId,
      type: "academic_submission",
      relatedId: record.$id,
      timestamp: record.$createdAt,
      message: `${studentName} uploaded academic results${record.semester ? ` for Semester ${record.semester}` : ""}.`,
    }));
  });

  (pendingAchievements.documents as ActivityDocument[]).forEach((achievement) => {
    const studentName = achievement.studentId ? studentMap[achievement.studentId] || "A mentee" : "A mentee";
    activities.push(createActivityNotification({
      id: achievement.$id,
      userId: feedUserId,
      type: "achievement_submission",
      relatedId: achievement.$id,
      timestamp: achievement.$createdAt,
      message: `${studentName} submitted an achievement${achievement.title ? `: ${achievement.title}` : ""}.`,
    }));
  });

  return activities;
}

async function getMenteeRecentActivity(adminDatabases: Databases, profileIds: string[], feedUserId: string) {
  const [meetings, academics, achievements] = await Promise.all([
    adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      [Query.equal("studentId", profileIds), Query.orderDesc("$createdAt"), Query.limit(10)]
    ).catch(() => ({ documents: [] })),
    adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
      [Query.equal("studentId", profileIds), Query.orderDesc("$createdAt"), Query.limit(10)]
    ).catch(() => ({ documents: [] })),
    adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
      [Query.equal("studentId", profileIds), Query.orderDesc("$createdAt"), Query.limit(10)]
    ).catch(() => ({ documents: [] })),
  ]);

  const activities: NotificationPayload[] = [];

  (meetings.documents as ActivityDocument[]).forEach((meeting) => {
    if (meeting.status === "Requested") {
      activities.push(createActivityNotification({
        id: meeting.$id,
        userId: feedUserId,
        type: "meeting_request",
        relatedId: meeting.$id,
        timestamp: meeting.$createdAt,
        message: `Your meeting request${meeting.proposedDate || meeting.date ? ` for ${meeting.proposedDate || meeting.date}` : ""} is waiting for mentor confirmation.`,
      }));
      return;
    }

    if (meeting.status === "Confirmed" || meeting.status === "Rejected") {
      activities.push(createActivityNotification({
        id: meeting.$id,
        userId: feedUserId,
        type: "meeting_request",
        relatedId: meeting.$id,
        timestamp: meeting.$createdAt,
        message: `Your meeting request has been ${String(meeting.status).toLowerCase()}.`,
      }));
      return;
    }

    if (meeting.status === "Scheduled") {
      activities.push(createActivityNotification({
        id: meeting.$id,
        userId: feedUserId,
        type: "meeting_request",
        relatedId: meeting.$id,
        timestamp: meeting.$createdAt,
        message: `A meeting${meeting.topic ? ` for "${meeting.topic}"` : ""} is scheduled${meeting.date ? ` on ${meeting.date}` : ""}.`,
      }));
    }
  });

  (academics.documents as ActivityDocument[]).forEach((record) => {
    const status = record.status || "Pending";
    activities.push(createActivityNotification({
      id: record.$id,
      userId: feedUserId,
      type: "academic_status",
      relatedId: record.$id,
      timestamp: record.$createdAt,
      message: `Your academic record${record.semester ? ` for Semester ${record.semester}` : ""} is ${String(status).toLowerCase()}.`,
    }));
  });

  (achievements.documents as ActivityDocument[]).forEach((achievement) => {
    const status = achievement.status || "Pending";
    activities.push(createActivityNotification({
      id: achievement.$id,
      userId: feedUserId,
      type: "achievement_status",
      relatedId: achievement.$id,
      timestamp: achievement.$createdAt,
      message: `Your achievement${achievement.title ? ` "${achievement.title}"` : ""} is ${String(status).toLowerCase()}.`,
    }));
  });

  return activities;
}

async function getNotificationRecipientIds() {
  const user = await getLoggedInUser();
  if (!user) return null;

  const adminDatabases = createAdminDatabases();
  const currentProfile = await getCurrentProfileForUser(adminDatabases, user.email).catch(() => null);
  const profileId = currentProfile?.$id || user.$id;

  return {
    user,
    adminDatabases,
    profileId,
    role: currentProfile?.role || "mentee",
    recipientIds: Array.from(new Set([user.$id, profileId])),
  };
}

async function getNotificationsForRecipients(adminDatabases: Databases, recipientIds: string[]) {
  const notificationCollection = process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!;

  if (!notificationCollection) return [];

  try {
    const notifications = await adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      notificationCollection,
      [
        Query.equal("userId", recipientIds),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]
    );

    return notifications.documents as unknown as NotificationPayload[];
  } catch {
    try {
      const notifications = await adminDatabases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        notificationCollection,
        [Query.limit(100)]
      );

      return (notifications.documents as unknown as NotificationPayload[]).filter((notification) =>
        recipientIds.includes(notification.userId)
      );
    } catch (error) {
      console.error("Failed to fetch stored notifications:", error);
      return [];
    }
  }
}

export async function getCurrentUserNotificationState() {
  try {
    const notificationScope = await getNotificationRecipientIds();
    if (!notificationScope) {
      return { notifications: [], unreadCount: 0, userId: null, profileId: null, role: null };
    }

    const notifications = await getNotificationsForRecipients(
      notificationScope.adminDatabases,
      notificationScope.recipientIds
    );
    const activity = notificationScope.role === "mentor"
      ? await getMentorRecentActivity(
          notificationScope.adminDatabases,
          notificationScope.recipientIds,
          notificationScope.profileId
        )
      : await getMenteeRecentActivity(
          notificationScope.adminDatabases,
          notificationScope.recipientIds,
          notificationScope.profileId
        );
    const mergedNotifications = mergeNotificationsWithActivity(
      JSON.parse(JSON.stringify(notifications)),
      JSON.parse(JSON.stringify(activity))
    );
    const unreadCount = mergedNotifications.filter((notification) => !notification.isRead).length;

    return JSON.parse(JSON.stringify({
      notifications: mergedNotifications,
      unreadCount,
      userId: notificationScope.user.$id,
      profileId: notificationScope.profileId,
      role: notificationScope.role,
    }));
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return { notifications: [], unreadCount: 0, userId: null, profileId: null, role: null };
  }
}

async function isNotificationOwnedByCurrentUser(notificationId: string) {
  const notificationScope = await getNotificationRecipientIds();
  if (!notificationScope) return null;

  const notification = await notificationScope.adminDatabases.getDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
    notificationId
  );

  if (!notificationScope.recipientIds.includes(notification.userId)) {
    return null;
  }

  return { adminDatabases: notificationScope.adminDatabases, notification };
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const ownedNotification = await isNotificationOwnedByCurrentUser(notificationId);
    if (!ownedNotification) return { success: false };

    await ownedNotification.adminDatabases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      notificationId,
      { isRead: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}

export async function markAllCurrentUserNotificationsAsRead() {
  try {
    const notificationScope = await getNotificationRecipientIds();
    if (!notificationScope) return { success: false };

    const notifications = await getNotificationsForRecipients(
      notificationScope.adminDatabases,
      notificationScope.recipientIds
    );

    await Promise.all(
      notifications
        .filter((notification) => !notification.isRead)
        .map((notification) =>
          notificationScope.adminDatabases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
            notification.$id,
            { isRead: true }
          )
        )
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false };
  }
}

export async function deleteCurrentUserNotification(notificationId: string) {
  try {
    const ownedNotification = await isNotificationOwnedByCurrentUser(notificationId);
    if (!ownedNotification) return { success: false };

    await ownedNotification.adminDatabases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      notificationId
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return { success: false };
  }
}

// Helper to create a notification for a user/profile id.
async function createNotification(userId: string, message: string, type: string, relatedId?: string) {
  try {
    const databases = createAdminDatabases();
    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        message,
        type,
        isRead: false,
        relatedId: relatedId || "",
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

async function notifyAssignedMentor(studentId: string, message: string, type: string, relatedId?: string) {
  try {
    const adminDatabases = createAdminDatabases();
    const student = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      studentId
    );

    if (!student.mentorId) return;

    await createNotification(student.mentorId, message, type, relatedId);
  } catch (error) {
    console.error("Failed to notify assigned mentor:", error);
  }
}


export async function getStudentProfile(profileId: string) {
  try {
    const adminDatabases = createAdminDatabases();
    await requireSelfOrAssignedMentor(adminDatabases, profileId);

    const profile = await adminDatabases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileId);
    
    let academics = null;
    try {
      const ACADEMICS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!;
      const acadList = await adminDatabases.listDocuments(
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

    const createdMeeting = await databases.createDocument(
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
    revalidatePath("/mentor-dashboard/approvals");

    await notifyAssignedMentor(
      data.studentId,
      `A meeting log for "${data.topic}" is waiting for your review.`,
      "meeting_log_submission",
      createdMeeting.$id
    );

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
    const adminDatabases = createAdminDatabases();
    const meeting = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      meetingId
    );

    if (meeting.studentId !== studentId) {
      throw new Error("Meeting and student do not match.");
    }

    await requireAssignedMentorForStudent(adminDatabases, studentId);

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

    await createNotification(
      studentId,
      `Your meeting log has been ${newStatus.toLowerCase()} by your mentor.`,
      "meeting_status",
      meetingId
    );

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update meeting status:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 11.5. Request Meeting (Mentee Action)
// ==========================================
export async function requestMeeting(studentId: string, formData: FormData) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, error: "You must be signed in to request a meeting." };
    }

    const proposedDate = String(formData.get("proposedDate") || "");
    const proposedTime = String(formData.get("proposedTime") || "");
    const agenda = String(formData.get("agenda") || "").trim();

    if (!proposedDate || !proposedTime || !agenda) {
      return { success: false, error: "Please provide a date, time, and agenda." };
    }

    const adminDatabases = createAdminDatabases();
    const profile = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      studentId
    );

    if (profile.email?.toLowerCase() !== user.email.toLowerCase()) {
      return { success: false, error: "You can only request meetings for your own profile." };
    }

    if (!profile.mentorId) {
      return { success: false, error: "A mentor has not been assigned to your profile yet." };
    }

    const mentorProfile = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      profile.mentorId
    ).catch(() => null);

    const mentorName = mentorProfile?.fullName || "Faculty Mentor";
    const richPayload = {
      studentId,
      mentorId: profile.mentorId,
      date: proposedDate,
      topic: "Meeting Request",
      mentorName,
      description: agenda,
      status: "Requested",
      requestedBy: "mentee",
      proposedDate,
      proposedTime,
      agenda,
    };

    let createdMeeting;
    try {
      createdMeeting = await adminDatabases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        ID.unique(),
        richPayload
      );
    } catch {
      const compatiblePayload = {
        studentId,
        date: proposedDate,
        topic: `Meeting Request (${proposedTime})`,
        mentorName,
        description: `Requested time: ${proposedTime}\n\nAgenda: ${agenda}`,
        status: "Requested",
      };
      createdMeeting = await adminDatabases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        ID.unique(),
        compatiblePayload
      );
    }

    revalidatePath(`/dashboard/${studentId}`);
    revalidatePath(`/dashboard/${studentId}/meetings`);
    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath("/mentor-dashboard");

    await createNotification(
      profile.mentorId,
      `${profile.fullName || "A mentee"} requested a meeting on ${proposedDate} at ${proposedTime}.`,
      "meeting_request_pending",
      createdMeeting.$id
    );

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to request meeting:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to request meeting.",
    };
  }
}

// ==========================================
// 11.6. Fetch Meeting Requests (Mentor)
// ==========================================
export async function getMeetingRequests(mentorId: string) {
  try {
    const adminDatabases = createAdminDatabases();
    const menteesList = await adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.equal("mentorId", [mentorId]), Query.limit(100)]
    );

    if (menteesList.total === 0) return [];

    const menteeIds: string[] = [];
    const studentMap: Record<string, string> = {};

    menteesList.documents.forEach((doc) => {
      menteeIds.push(doc.$id);
      studentMap[doc.$id] = doc.fullName || "Unknown Student";
    });

    const requests = await adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      [
        Query.equal("studentId", menteeIds),
        Query.equal("status", ["Requested"]),
        Query.orderDesc("$createdAt"),
      ]
    );

    const mappedRequests = requests.documents.map((request) => ({
      ...request,
      studentName: studentMap[request.studentId] || "Unknown Student",
    }));

    return JSON.parse(JSON.stringify(mappedRequests));
  } catch (error) {
    console.error("Failed to fetch meeting requests:", error);
    return [];
  }
}

// ==========================================
// 11.7. Respond to Meeting Request (Mentor)
// ==========================================
export async function respondToMeetingRequest(meetingId: string, response: "Confirmed" | "Rejected", message?: string) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, error: "You must be signed in to respond to requests." };
    }

    const adminDatabases = createAdminDatabases();
    const meeting = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      meetingId
    );

    const student = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      meeting.studentId
    );

    if (student.mentorId !== user.$id) {
      return { success: false, error: "Only the assigned mentor can respond to this request." };
    }

    let updatedDescription = meeting.description || "";
    if (message) {
      const header = response === "Rejected" ? "Mentor Rejection Reason" : "Mentor Message";
      updatedDescription = `${updatedDescription}\n\n--- ${header} ---\n${message}`;
    }

    await adminDatabases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      meetingId,
      { 
        status: response,
        description: updatedDescription
      }
    );

    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath(`/dashboard/${meeting.studentId}`);
    revalidatePath(`/dashboard/${meeting.studentId}/meetings`);
    revalidatePath(`/dashboard/${meeting.studentId}/notifications`);

    await createNotification(
      meeting.studentId,
      `Your meeting request has been ${response.toLowerCase()} by your mentor.`,
      "meeting_request",
      meetingId
    );

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to respond to meeting request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to respond to meeting request.",
    };
  }
}

// ==========================================
// 11.8. Schedule Meeting For Mentor Roster
// ==========================================
export async function scheduleMentorMeeting(formData: FormData) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, error: "You must be signed in to schedule a meeting." };
    }

    const topic = String(formData.get("topic") || "").trim();
    const date = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");
    const mode = String(formData.get("mode") || "OFFLINE").toUpperCase();
    const link = String(formData.get("link") || "").trim();
    const venue = String(formData.get("venue") || "").trim();
    const agenda = String(formData.get("agenda") || "").trim();
    const recipientMode = String(formData.get("recipientMode") || "all");
    const selectedStudentIds = formData
      .getAll("studentIds")
      .map((id) => String(id))
      .filter(Boolean);

    if (!topic || !date || !time || !agenda) {
      return { success: false, error: "Please provide a topic, date, time, and agenda." };
    }

    if (mode === "ONLINE" && !link) {
      return { success: false, error: "Please add a meeting link for online meetings." };
    }

    const adminDatabases = createAdminDatabases();
    const mentorProfile = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      user.$id
    ).catch(() => null);

    if (mentorProfile && mentorProfile.role !== "mentor") {
      return { success: false, error: "Only mentors can schedule roster meetings." };
    }

    const mentees = await adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [
        Query.equal("role", ["mentee"]),
        Query.equal("mentorId", user.$id),
        Query.limit(100),
      ]
    );

    if (mentees.total === 0) {
      return { success: false, error: "No assigned mentees found for this mentor." };
    }

    const targetMentees = recipientMode === "selected"
      ? mentees.documents.filter((mentee) => selectedStudentIds.includes(mentee.$id))
      : mentees.documents;

    if (recipientMode === "selected" && selectedStudentIds.length === 0) {
      return { success: false, error: "Please select at least one mentee." };
    }

    if (targetMentees.length === 0) {
      return { success: false, error: "No valid assigned mentees were selected." };
    }

    const mentorName = mentorProfile?.fullName || user.name || "Faculty Mentor";
    const reportVenue = mode === "ONLINE" ? (link || "Online") : (venue || "Offline");
    const description = [
      MENTOR_SCHEDULED_MEETING_MARKER,
      `Time: ${time}`,
      `Mode: ${mode === "ONLINE" ? "Online" : "Offline"}`,
      `Venue: ${reportVenue}`,
      mode === "ONLINE" ? `Link: ${link}` : "",
      "",
      "Agenda:",
      agenda,
    ].filter(Boolean).join("\n");

    let supportsRichPayload = true;
    let createdCount = 0;

    for (const mentee of targetMentees) {
      const basePayload = {
        studentId: mentee.$id,
        date,
        topic,
        mentorName,
        description,
        status: "Scheduled",
      };

      const richPayload = {
        ...basePayload,
        mentorId: user.$id,
        scheduledBy: "mentor",
        scheduledTime: time,
        meetingMode: mode,
        meetingLink: mode === "ONLINE" ? link : "",
        agenda,
      };

      let createdMeeting;
      if (supportsRichPayload) {
        try {
          createdMeeting = await adminDatabases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
            ID.unique(),
            richPayload
          );
        } catch {
          supportsRichPayload = false;
        }
      }

      if (!createdMeeting) {
        createdMeeting = await adminDatabases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
          ID.unique(),
          basePayload
        );
      }

      createdCount += 1;

      await createNotification(
        mentee.$id,
        `Your mentor scheduled "${topic}" on ${date} at ${time}.`,
        "meeting_request",
        createdMeeting.$id
      );
    }

    revalidatePath("/mentor-dashboard");
    for (const mentee of targetMentees) {
      revalidatePath(`/dashboard/${mentee.$id}`);
      revalidatePath(`/dashboard/${mentee.$id}/meetings`);
    }

    return { success: true, count: createdCount };
  } catch (error: unknown) {
    console.error("Failed to schedule mentor meeting:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule meeting.",
    };
  }
}

// ==========================================
// 11.9. Fetch Mentor Scheduled Meetings
// ==========================================
export async function getMentorScheduledMeetings(mentorId: string) {
  try {
    const adminDatabases = createAdminDatabases();
    const mentees = await adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [
        Query.equal("role", ["mentee"]),
        Query.equal("mentorId", mentorId),
        Query.limit(100),
      ]
    );

    if (mentees.total === 0) return [];

    const menteeIds: string[] = [];
    const studentMap: Record<string, {
      $id: string;
      fullName?: string;
      email?: string;
      department?: string;
      rollNo?: string;
      semester?: string;
      profilePictureId?: string;
    }> = {};
    mentees.documents.forEach((mentee) => {
      menteeIds.push(mentee.$id);
      studentMap[mentee.$id] = mentee;
    });

    const meetings = await adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      [
        Query.equal("studentId", menteeIds),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]
    );

    const scheduledMeetings = meetings.documents
      .filter((meeting) => String(meeting.description || "").includes(MENTOR_SCHEDULED_MEETING_MARKER))
      .map((meeting) => ({
        ...meeting,
        student: studentMap[meeting.studentId] || null,
        studentName: studentMap[meeting.studentId]?.fullName || "Unknown Student",
      }));

    return JSON.parse(JSON.stringify(scheduledMeetings));
  } catch (error) {
    console.error("Failed to fetch mentor scheduled meetings:", error);
    return [];
  }
}

// ==========================================
// 11.10. Mark Roster Meeting Attendance
// ==========================================
export async function updateScheduledMeetingAttendance(meetingId: string, studentId: string, attended: boolean) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, error: "You must be signed in to update attendance." };
    }

    const adminDatabases = createAdminDatabases();
    const [meeting, student] = await Promise.all([
      adminDatabases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        meetingId
      ),
      adminDatabases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        studentId
      ),
    ]);

    if (student.mentorId !== user.$id || meeting.studentId !== studentId) {
      return { success: false, error: "Only the assigned mentor can update this attendance." };
    }

    if (!String(meeting.description || "").includes(MENTOR_SCHEDULED_MEETING_MARKER)) {
      return { success: false, error: "This meeting is not a roster scheduled meeting." };
    }

    await adminDatabases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
      meetingId,
      { status: attended ? "Verified" : "Scheduled" }
    );

    revalidatePath("/mentor-dashboard");
    revalidatePath(`/dashboard/${studentId}`);
    revalidatePath(`/dashboard/${studentId}/meetings`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update meeting attendance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update attendance.",
    };
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
    await requireSelfProfile(databases, studentId);

    const semester = formData.get("semester") as string;
    const spi = formData.get("spi") as string;
    const cpi = formData.get("cpi") as string;
    const file = validateUploadFile(formData.get("file") as File | null, {
      required: true,
      maxBytes: 5 * 1024 * 1024,
      allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    });
    if (!file) throw new Error("Please select a valid file.");

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

    const academicRecord = await databases.createDocument(
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
    revalidatePath("/mentor-dashboard");
    revalidatePath("/mentor-dashboard/approvals");

    await notifyAssignedMentor(
      studentId,
      `A mentee submitted Semester ${semester} academic records for approval.`,
      "academic_submission",
      academicRecord.$id
    );

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
    const databases = createAdminDatabases();
    const record = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
      recordId
    );

    if (record.studentId !== studentId) {
      throw new Error("Academic record and student do not match.");
    }

    await requireAssignedMentorForStudent(databases, studentId);

    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
      recordId,
      { status: newStatus }
    );

    revalidatePath(`/dashboard/${studentId}/academics`);
    revalidatePath(`/dashboard/${studentId}/notifications`);
    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath("/mentor-dashboard");

    await createNotification(
      studentId,
      `Your academic record has been ${newStatus.toLowerCase()} by your mentor.`,
      "academic_status",
      recordId
    );

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
    await requireSelfProfile(databases, studentId);

    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const file = validateUploadFile(formData.get("file") as File | null, {
      required: false,
      maxBytes: 5 * 1024 * 1024,
      allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    });

    let fileId = null;

    // Only upload to storage if a proof file was actually attached
    if (file) {
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

    const achievement = await databases.createDocument(
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
    revalidatePath("/mentor-dashboard");
    revalidatePath("/mentor-dashboard/approvals");

    await notifyAssignedMentor(
      studentId,
      `A mentee submitted "${title}" for achievement approval.`,
      "achievement_submission",
      achievement.$id
    );

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
    const databases = createAdminDatabases();
    const achievement = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
      achievementId
    );

    if (achievement.studentId !== studentId) {
      throw new Error("Achievement and student do not match.");
    }

    await requireAssignedMentorForStudent(databases, studentId);

    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
      achievementId,
      { status: newStatus }
    );

    revalidatePath(`/dashboard/${studentId}/achievements`);
    revalidatePath(`/dashboard/${studentId}/notifications`);
    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath("/mentor-dashboard");

    await createNotification(
      studentId,
      `Your achievement has been ${newStatus.toLowerCase()} by your mentor.`,
      "achievement_status",
      achievementId
    );

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
    await requireSelfProfile(databases, profileId);

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

    const [student, mentor] = await Promise.all([
      databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        studentId
      ),
      databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        mentorId
      ),
    ]);

    if (student.role !== "mentee" || mentor.role !== "mentor") {
      throw new Error("Please select a valid student and mentor.");
    }

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
    await requireAdminOrCoordinator(databases);
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
      [Query.equal("mentorId", [mentorId]), Query.limit(100)]
    );

    if (menteesList.total === 0) return { meetings: [], meetingRequests: [], academics: [], achievements: [] };

    // 2. Map their IDs and Names so we know WHO submitted the request
    const menteeIds: string[] = [];
    const studentMap: Record<string, string> = {};
    
    menteesList.documents.forEach((doc) => {
      menteeIds.push(doc.$id);
      studentMap[doc.$id] = doc.fullName;
    });

    // 3. Fetch ALL pending requests across all three collections simultaneously using Promise.all
    const [pendingMeetings, meetingRequests, pendingAcademics, pendingAchievements] = await Promise.all([
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(100)]
      ),
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!,
        [Query.equal("studentId", menteeIds), Query.equal("status", ["Requested"]), Query.orderDesc("$createdAt"), Query.limit(100)]
      ),
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
        [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(100)]
      ),
      databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
        [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(100)]
      )
    ]);

    // 4. Attach the student's name to the requests
    const mapWithNames = (docs: Array<{ studentId?: string; [key: string]: unknown }>) => docs.map(doc => ({
      ...doc,
      studentName: doc.studentId ? studentMap[doc.studentId] || "Unknown Student" : "Unknown Student"
    }));

    return JSON.parse(JSON.stringify({ 
      meetings: mapWithNames(pendingMeetings.documents),
      meetingRequests: mapWithNames(meetingRequests.documents),
      academics: mapWithNames(pendingAcademics.documents),
      achievements: mapWithNames(pendingAchievements.documents)
    }));

  } catch (error) {
    console.error("Failed to fetch pending approvals:", error);
    return { meetings: [], meetingRequests: [], academics: [], achievements: [] };
  }
}

// ==========================================
// 21. Master Verification Toggle
// ==========================================

export async function toggleStudentVerification(studentId: string, currentStatus: boolean) {
  try {
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);
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

    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();
    const scope = await requireAdminOrCoordinator(databases);
    if (scope.profile.$id === profileId || scope.user.$id === profileId) {
      throw new Error("You cannot delete your own account.");
    }

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);
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

    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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

    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

    const [student, mentor] = await Promise.all([
      databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        studentId
      ),
      databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
        mentorId
      ),
    ]);

    if (student.role !== "mentee" || mentor.role !== "mentor") {
      throw new Error("Please select a valid student and mentor.");
    }

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
    if (file.size > 2 * 1024 * 1024) throw new Error("CSV file must be 2MB or smaller.");

    // Read the file content as text
    const text = await file.text();
    
    // Split the text into an array of lines, ignoring empty rows
    const lines = text.split("\n").filter(line => line.trim() !== "");

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();
    await requireAdminOrCoordinator(databases);

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
    const databases = createAdminDatabases();

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

    if (mentees.total === 0) return [];

    const menteeIds = mentees.documents.map((mentee) => mentee.$id);
    let latestAcademicByStudent: Record<string, { cpi?: string | number; spi?: string | number; semester?: string | number }> = {};

    try {
      const academicRecords = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
        [
          Query.equal("studentId", menteeIds),
          Query.equal("status", ["Verified"]),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]
      );

      latestAcademicByStudent = academicRecords.documents.reduce((acc, record) => {
        if (record.studentId && !acc[record.studentId]) {
          acc[record.studentId] = {
            cpi: record.cpi,
            spi: record.spi,
            semester: record.semester,
          };
        }

        return acc;
      }, {} as Record<string, { cpi?: string | number; spi?: string | number; semester?: string | number }>);
    } catch (error) {
      console.error("Failed to fetch roster academic performance:", error);
    }

    const roster = mentees.documents.map((mentee) => {
      const latestAcademic = latestAcademicByStudent[mentee.$id];
      const profileCgpa = Number(mentee.cgpa || 0);
      const latestCpi = Number(latestAcademic?.cpi || 0);
      const latestSpi = Number(latestAcademic?.spi || 0);
      const performanceScore = latestCpi || profileCgpa || latestSpi || 0;

      return {
        ...mentee,
        latestCpi: latestAcademic?.cpi || "",
        latestSpi: latestAcademic?.spi || "",
        latestAcademicSemester: latestAcademic?.semester || "",
        performanceScore,
        performanceSource: latestCpi ? "Latest CPI" : profileCgpa ? "Profile CGPA" : latestSpi ? "Latest SPI" : "No verified score",
      };
    });

    return JSON.parse(JSON.stringify(roster));
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
    await requireSelfProfile(databases, userId);

    let profilePictureId = null;

    // 1. Process and upload the image if it exists
    const file = validateUploadFile(formData.get("profilePicture") as File | null, {
      required: false,
      maxBytes: 2 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png"],
    });
    if (file) {
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
      fullName: formData.get("fullName"),
      rollNo: formData.get("rollNo"),
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
    const databases = createAdminDatabases();
    await requireSelfOrAssignedMentor(databases, userId);

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
// 37.5. Get Latest Academic Record
// ==========================================
export async function getLatestAcademicRecord(studentId: string) {
  try {
    const databases = createAdminDatabases();
    await requireSelfOrAssignedMentor(databases, studentId);

    const academicsRes = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
      [
        Query.equal("studentId", studentId),
        Query.orderDesc("$createdAt"),
        Query.limit(1)
      ]
    );

    return academicsRes.documents.length > 0 ? JSON.parse(JSON.stringify(academicsRes.documents[0])) : null;
  } catch (error) {
    console.error("Failed to fetch latest academic record:", error);
    return null;
  }
}

// ==========================================
// 37.6. Get Academic Records With Access Check
// ==========================================
export async function getAcademicRecordsForProfile(studentId: string) {
  try {
    const user = await getLoggedInUser();
    if (!user) return [];

    const adminDatabases = createAdminDatabases();

    const student = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      studentId
    );

    const currentProfile = await getProfileByEmail(user.email);
    const isOwnProfile = student.email?.toLowerCase() === user.email.toLowerCase();
    const isAssignedMentor = currentProfile?.role === "mentor" && student.mentorId === currentProfile.$id;

    if (!isOwnProfile && !isAssignedMentor) return [];

    const academicsRes = await adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!,
      [
        Query.equal("studentId", studentId),
        Query.orderDesc("$createdAt")
      ]
    );

    return JSON.parse(JSON.stringify(academicsRes.documents));
  } catch (error) {
    console.error("Failed to fetch academic records:", error);
    return [];
  }
}

// ==========================================
// 37.7. Get Achievement Records With Access Check
// ==========================================
export async function getAchievementRecordsForProfile(studentId: string) {
  try {
    const user = await getLoggedInUser();
    if (!user) return [];

    const adminDatabases = createAdminDatabases();

    const student = await adminDatabases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      studentId
    );

    const currentProfile = await getProfileByEmail(user.email);
    const isOwnProfile = student.email?.toLowerCase() === user.email.toLowerCase();
    const isAssignedMentor = currentProfile?.role === "mentor" && student.mentorId === currentProfile.$id;

    if (!isOwnProfile && !isAssignedMentor) return [];

    const achievementsRes = await adminDatabases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
      [
        Query.equal("studentId", studentId),
        Query.orderDesc("$createdAt")
      ]
    );

    return JSON.parse(JSON.stringify(achievementsRes.documents));
  } catch (error) {
    console.error("Failed to fetch achievement records:", error);
    return [];
  }
}


// ==========================================
// 38. Exact-Match Advisory Import (Admin)
// ==========================================
export async function importMasterAdvisoryList(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) throw new Error("Please select a valid CSV file.");
    if (file.size > 2 * 1024 * 1024) throw new Error("CSV file must be 2MB or smaller.");

    const text = await file.text();
    const lines = text.split(/\r?\n/); // Split by row

    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(adminClient);
    const users = new Users(adminClient);
    await requireAdminOrCoordinator(databases);

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
