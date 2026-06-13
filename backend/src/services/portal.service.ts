import { Databases, ID, Query, Storage, Users } from "node-appwrite";
import { createAdminClient } from "../../app";

const { InputFile } = require("node-appwrite/file");

type PortalContext = {
  user: any;
  profile: any;
};

type EncodedFile = {
  name: string;
  type: string;
  size: number;
  base64: string;
};

const MEETING_MARKER = "[Mentor Scheduled Meeting]";

const env = (name: string, fallback?: string) => {
  const value = process.env[name] || (fallback ? process.env[fallback] : undefined);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const databaseId = () => env("APPWRITE_DATABASE_ID", "NEXT_PUBLIC_APPWRITE_DATABASE_ID");
const profilesId = () => env("APPWRITE_PROFILES_ID", "NEXT_PUBLIC_APPWRITE_PROFILES_ID");
const meetingsId = () => env("APPWRITE_MEETINGS_COLLECTION_ID", "NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID");
const academicsId = () => env("APPWRITE_ACADEMICS_COLLECTION_ID", "NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID");
const achievementsId = () => env("APPWRITE_ACHIEVEMENTS_COLLECTION_ID", "NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID");
const noticesId = () => env("APPWRITE_NOTICES_COLLECTION_ID", "NEXT_PUBLIC_APPWRITE_NOTICES_COLLECTION_ID");
const notificationsId = () => env("APPWRITE_NOTIFICATIONS_COLLECTION_ID", "NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID");
const settingsId = () => env("APPWRITE_SETTINGS_COLLECTION_ID", "NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID");
const bucketId = () => env("APPWRITE_STORAGE_BUCKET_ID", "NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID");

const asJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function adminDatabases() {
  return new Databases(createAdminClient());
}

function adminStorage() {
  return new Storage(createAdminClient());
}

function requireRole(ctx: PortalContext, roles: string[]) {
  if (!roles.includes(ctx.profile?.role || "")) {
    throw new Error("You do not have permission to perform this action.");
  }
}

async function getProfile(id: string) {
  return adminDatabases().getDocument(databaseId(), profilesId(), id);
}

async function getProfileByEmail(email: string) {
  const profiles = await adminDatabases().listDocuments(
    databaseId(),
    profilesId(),
    [Query.equal("email", [email.toLowerCase().trim()])]
  );
  return profiles.documents[0] || null;
}

async function requireSelfOrAssignedMentor(ctx: PortalContext, studentId: string) {
  if (ctx.profile.role === "admin" || ctx.profile.role === "coordinator") return;
  if (ctx.profile.$id === studentId) return;

  const student = await getProfile(studentId);
  if (ctx.profile.role === "mentor" && student.mentorId === ctx.profile.$id) return;

  throw new Error("You do not have permission to access this student.");
}

async function requireAssignedMentor(ctx: PortalContext, studentId: string) {
  requireRole(ctx, ["mentor"]);
  const student = await getProfile(studentId);
  if (student.mentorId !== ctx.profile.$id) {
    throw new Error("Only the assigned mentor can perform this action.");
  }
  return student;
}

function decodeFile(file: EncodedFile | null | undefined, options: { required: boolean; maxBytes: number; allowedTypes: string[] }) {
  if (!file || !file.base64 || file.size === 0) {
    if (options.required) throw new Error("Please select a valid file.");
    return null;
  }
  if (file.size > options.maxBytes) {
    throw new Error(`File must be ${Math.floor(options.maxBytes / (1024 * 1024))}MB or smaller.`);
  }
  if (!options.allowedTypes.includes(file.type)) {
    throw new Error("Unsupported file type.");
  }
  return InputFile.fromBuffer(Buffer.from(file.base64, "base64"), file.name);
}

async function uploadFile(file: EncodedFile | null | undefined, options: { required: boolean; maxBytes: number; allowedTypes: string[] }) {
  const inputFile = decodeFile(file, options);
  if (!inputFile) return null;
  const uploaded = await adminStorage().createFile(bucketId(), ID.unique(), inputFile);
  return uploaded.$id;
}

async function createNotification(userId: string, message: string, type: string, relatedId?: string) {
  try {
    await adminDatabases().createDocument(databaseId(), notificationsId(), ID.unique(), {
      userId,
      message,
      type,
      isRead: false,
      relatedId: relatedId || "",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

async function notifyAssignedMentor(studentId: string, message: string, type: string, relatedId?: string) {
  const student = await getProfile(studentId).catch(() => null);
  if (student?.mentorId) {
    await createNotification(student.mentorId, message, type, relatedId);
  }
}

function makeActivity(id: string, userId: string, message: string, type: string, relatedId: string, timestamp?: string) {
  return { $id: `activity-${type}-${id}`, userId, message, type, relatedId, isRead: false, isVirtual: true, timestamp: timestamp || new Date().toISOString() };
}

function sortNotifications(notifications: any[]) {
  return notifications.sort((a, b) => new Date(b.timestamp || b.$createdAt || 0).getTime() - new Date(a.timestamp || a.$createdAt || 0).getTime());
}

function mergeNotifications(notifications: any[], activity: any[]) {
  const seen = new Set<string>();
  return sortNotifications([...notifications, ...activity].filter((notification) => {
    const key = `${notification.type}:${notification.relatedId || notification.$id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })).slice(0, 25);
}

export class PortalService {
  static async run(action: string, payload: any, ctx: PortalContext) {
    const method = (this as any)[action];
    if (typeof method !== "function" || action === "run") {
      throw new Error(`Unsupported portal action: ${action}`);
    }
    return method.call(this, payload || {}, ctx);
  }

  static async getProfileByEmail({ email }: { email: string }) {
    return asJson(await getProfileByEmail(email));
  }

  static async checkUserRole({ email }: { email: string }) {
    const profile = await getProfileByEmail(email);
    return profile?.role || null;
  }

  static async getStudentProfile({ profileId }: { profileId: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, profileId);
    const db = adminDatabases();
    const [profile, academics] = await Promise.all([
      db.getDocument(databaseId(), profilesId(), profileId).catch(() => null),
      db.listDocuments(databaseId(), academicsId(), [Query.equal("studentId", [profileId]), Query.orderDesc("$createdAt"), Query.limit(1)]).catch(() => ({ documents: [] })),
    ]);
    return profile ? asJson({ profile, academics: academics.documents[0] || null }) : null;
  }

  static async getMenteeProfile({ userId }: { userId: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, userId);
    return asJson(await getProfile(userId));
  }

  static async createStudentProfile({ studentData }: { studentData: any }) {
    const profile = await adminDatabases().createDocument(databaseId(), profilesId(), ID.unique(), {
      fullName: studentData.fullName,
      email: studentData.email,
      role: "mentee",
      department: studentData.department,
      rollNo: studentData.rollNumber,
      phone: studentData.phone,
      bio: "",
      isVerified: false,
      skills: [],
    });
    return { success: true, profileId: profile.$id };
  }

  static async getLatestNotices({ limit = 5 }: { limit?: number }) {
    const notices = await adminDatabases().listDocuments(databaseId(), noticesId(), [Query.orderDesc("$createdAt"), Query.limit(limit)]);
    return asJson(notices.documents);
  }

  static async getAllStudents(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator", "mentor"]);
    const students = await adminDatabases().listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"]), Query.orderDesc("$createdAt")]);
    return asJson(students.documents);
  }

  static async getAchievements({ studentId }: { studentId: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, studentId);
    const result = await adminDatabases().listDocuments(databaseId(), achievementsId(), [Query.equal("studentId", [studentId]), Query.orderDesc("$createdAt")]);
    return asJson(result.documents);
  }

  static async addAchievement({ studentId, title, category }: { studentId: string; title: string; category: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, studentId);
    await adminDatabases().createDocument(databaseId(), achievementsId(), ID.unique(), { studentId, title, category });
    return { success: true };
  }

  static async saveAcademics({ studentId, year, gpa, documentId }: { studentId: string; year: string; gpa: number; documentId?: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, studentId);
    const db = adminDatabases();
    if (documentId) await db.updateDocument(databaseId(), academicsId(), documentId, { year, gpa });
    else await db.createDocument(databaseId(), academicsId(), ID.unique(), { studentId, year, gpa });
    return { success: true };
  }

  static async getMeetings({ studentId }: { studentId: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, studentId);
    const result = await adminDatabases().listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", [studentId]), Query.orderDesc("date")]);
    return asJson(result.documents);
  }

  static async logMeeting({ data }: { data: any }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, data.studentId);
    const meeting = await adminDatabases().createDocument(databaseId(), meetingsId(), ID.unique(), {
      studentId: data.studentId,
      date: data.date,
      topic: data.topic,
      mentorName: data.mentorName,
      description: data.description,
      status: "Pending",
    });
    await notifyAssignedMentor(data.studentId, `A meeting log for "${data.topic}" is waiting for your review.`, "meeting_log_submission", meeting.$id);
    return { success: true };
  }

  static async updateMeetingStatus({ meetingId, newStatus, studentId }: { meetingId: string; newStatus: string; studentId: string }, ctx: PortalContext) {
    const db = adminDatabases();
    const meeting = await db.getDocument(databaseId(), meetingsId(), meetingId);
    if (meeting.studentId !== studentId) throw new Error("Meeting and student do not match.");
    await requireAssignedMentor(ctx, studentId);
    await db.updateDocument(databaseId(), meetingsId(), meetingId, { status: newStatus });
    await createNotification(studentId, `Your meeting log has been ${newStatus.toLowerCase()} by your mentor.`, "meeting_status", meetingId);
    return { success: true };
  }

  static async requestMeeting({ studentId, form }: { studentId: string; form: any }, ctx: PortalContext) {
    if (ctx.profile.$id !== studentId) throw new Error("You can only request meetings for your own profile.");
    const proposedDate = String(form.proposedDate || "");
    const proposedTime = String(form.proposedTime || "");
    const agenda = String(form.agenda || "").trim();
    if (!proposedDate || !proposedTime || !agenda) throw new Error("Please provide a date, time, and agenda.");

    const profile = await getProfile(studentId);
    if (!profile.mentorId) throw new Error("A mentor has not been assigned to your profile yet.");
    const mentorProfile = await getProfile(profile.mentorId).catch(() => null);
    const mentorName = mentorProfile?.fullName || "Faculty Mentor";
    const db = adminDatabases();

    let createdMeeting;
    try {
      createdMeeting = await db.createDocument(databaseId(), meetingsId(), ID.unique(), {
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
      });
    } catch {
      createdMeeting = await db.createDocument(databaseId(), meetingsId(), ID.unique(), {
        studentId,
        date: proposedDate,
        topic: `Meeting Request (${proposedTime})`,
        mentorName,
        description: `Requested time: ${proposedTime}\n\nAgenda: ${agenda}`,
        status: "Requested",
      });
    }

    await createNotification(profile.mentorId, `${profile.fullName || "A mentee"} requested a meeting on ${proposedDate} at ${proposedTime}.`, "meeting_request_pending", createdMeeting.$id);
    return { success: true };
  }

  static async getMeetingRequests({ mentorId }: { mentorId: string }, ctx: PortalContext) {
    if (ctx.profile.role === "mentor" && ctx.profile.$id !== mentorId) throw new Error("You can only access your own mentor workspace.");
    const db = adminDatabases();
    const mentees = await db.listDocuments(databaseId(), profilesId(), [Query.equal("mentorId", [mentorId]), Query.limit(100)]);
    if (mentees.total === 0) return [];
    const menteeIds = mentees.documents.map((doc) => doc.$id);
    const studentMap = Object.fromEntries(mentees.documents.map((doc) => [doc.$id, doc.fullName || "Unknown Student"]));
    const requests = await db.listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", menteeIds), Query.equal("status", ["Requested"]), Query.orderDesc("$createdAt")]);
    return asJson(requests.documents.map((request) => ({ ...request, studentName: studentMap[request.studentId] || "Unknown Student" })));
  }

  static async respondToMeetingRequest({ meetingId, response, message }: { meetingId: string; response: string; message?: string }, ctx: PortalContext) {
    const db = adminDatabases();
    const meeting = await db.getDocument(databaseId(), meetingsId(), meetingId);
    const student = await getProfile(meeting.studentId);
    if (student.mentorId !== ctx.profile.$id) throw new Error("Only the assigned mentor can respond to this request.");
    let description = meeting.description || "";
    if (message) {
      const header = response === "Rejected" ? "Mentor Rejection Reason" : "Mentor Message";
      description = `${description}\n\n--- ${header} ---\n${message}`;
    }
    await db.updateDocument(databaseId(), meetingsId(), meetingId, { status: response, description });
    await createNotification(meeting.studentId, `Your meeting request has been ${response.toLowerCase()} by your mentor.`, "meeting_request", meetingId);
    return { success: true };
  }

  static async scheduleMentorMeeting({ form }: { form: any }, ctx: PortalContext) {
    requireRole(ctx, ["mentor"]);
    const topic = String(form.topic || "").trim();
    const date = String(form.date || "");
    const time = String(form.time || "");
    const mode = String(form.mode || "OFFLINE").toUpperCase();
    const link = String(form.link || "").trim();
    const venue = String(form.venue || "").trim();
    const agenda = String(form.agenda || "").trim();
    const recipientMode = String(form.recipientMode || "all");
    const selectedStudentIds = Array.isArray(form.studentIds) ? form.studentIds.map(String).filter(Boolean) : [];
    if (!topic || !date || !time || !agenda) throw new Error("Please provide a topic, date, time, and agenda.");
    if (mode === "ONLINE" && !link) throw new Error("Please add a meeting link for online meetings.");

    const db = adminDatabases();
    const mentees = await db.listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"]), Query.equal("mentorId", ctx.profile.$id), Query.limit(100)]);
    const targetMentees = recipientMode === "selected" ? mentees.documents.filter((m) => selectedStudentIds.includes(m.$id)) : mentees.documents;
    if (targetMentees.length === 0) throw new Error(recipientMode === "selected" ? "No valid assigned mentees were selected." : "No assigned mentees found for this mentor.");

    const reportVenue = mode === "ONLINE" ? (link || "Online") : (venue || "Offline");
    const description = [MEETING_MARKER, `Time: ${time}`, `Mode: ${mode === "ONLINE" ? "Online" : "Offline"}`, `Venue: ${reportVenue}`, mode === "ONLINE" ? `Link: ${link}` : "", "", "Agenda:", agenda].filter(Boolean).join("\n");
    let supportsRichPayload = true;
    let createdCount = 0;
    for (const mentee of targetMentees) {
      const basePayload = { studentId: mentee.$id, date, topic, mentorName: ctx.profile.fullName || ctx.user.name || "Faculty Mentor", description, status: "Scheduled" };
      const richPayload = { ...basePayload, mentorId: ctx.profile.$id, scheduledBy: "mentor", scheduledTime: time, meetingMode: mode, meetingLink: mode === "ONLINE" ? link : "", agenda };
      let meeting;
      if (supportsRichPayload) {
        try {
          meeting = await db.createDocument(databaseId(), meetingsId(), ID.unique(), richPayload);
        } catch {
          supportsRichPayload = false;
        }
      }
      if (!meeting) meeting = await db.createDocument(databaseId(), meetingsId(), ID.unique(), basePayload);
      createdCount += 1;
      await createNotification(mentee.$id, `Your mentor scheduled "${topic}" on ${date} at ${time}.`, "meeting_request", meeting.$id);
    }
    return { success: true, count: createdCount };
  }

  static async getMentorScheduledMeetings({ mentorId }: { mentorId: string }, ctx: PortalContext) {
    if (ctx.profile.role === "mentor" && ctx.profile.$id !== mentorId) throw new Error("You can only access your own mentor workspace.");
    const db = adminDatabases();
    const mentees = await db.listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"]), Query.equal("mentorId", mentorId), Query.limit(100)]);
    if (mentees.total === 0) return [];
    const studentMap = Object.fromEntries(mentees.documents.map((m) => [m.$id, m]));
    const meetings = await db.listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", mentees.documents.map((m) => m.$id)), Query.orderDesc("$createdAt"), Query.limit(100)]);
    return asJson(meetings.documents
      .filter((meeting) => String(meeting.description || "").includes(MEETING_MARKER))
      .map((meeting) => ({ ...meeting, student: studentMap[meeting.studentId] || null, studentName: studentMap[meeting.studentId]?.fullName || "Unknown Student" })));
  }

  static async updateScheduledMeetingAttendance({ meetingId, studentId, attended }: { meetingId: string; studentId: string; attended: boolean }, ctx: PortalContext) {
    const db = adminDatabases();
    const [meeting, student] = await Promise.all([db.getDocument(databaseId(), meetingsId(), meetingId), getProfile(studentId)]);
    if (student.mentorId !== ctx.profile.$id || meeting.studentId !== studentId) throw new Error("Only the assigned mentor can update this attendance.");
    if (!String(meeting.description || "").includes(MEETING_MARKER)) throw new Error("This meeting is not a roster scheduled meeting.");
    await db.updateDocument(databaseId(), meetingsId(), meetingId, { status: attended ? "Verified" : "Scheduled" });
    return { success: true };
  }

  static async updateMeetingCommonPoints({ meetingIds, commonPoints }: { meetingIds: string[]; commonPoints: string }, ctx: PortalContext) {
    requireRole(ctx, ["mentor"]);
    if (!Array.isArray(meetingIds) || meetingIds.length === 0) throw new Error("No meeting IDs provided.");
    const text = String(commonPoints ?? "").trim();
    const db = adminDatabases();

    for (const id of meetingIds) {
      const meeting = await db.getDocument(databaseId(), meetingsId(), id);
      if (!String(meeting.description || "").includes(MEETING_MARKER)) throw new Error("One or more meetings are not roster scheduled meetings.");
      // Try saving as a dedicated commonPoints attribute first
      try {
        await db.updateDocument(databaseId(), meetingsId(), id, { commonPoints: text });
      } catch {
        // Attribute may not exist yet – embed into description as a fallback
        const desc = String(meeting.description || "");
        const marker = "\n---COMMON_POINTS---\n";
        const base = desc.includes(marker) ? desc.slice(0, desc.indexOf(marker)) : desc;
        await db.updateDocument(databaseId(), meetingsId(), id, { description: base + marker + text });
      }
    }
    return { success: true };
  }

  static async updateMeetingStudentNotes({ meetingId, studentNotes }: { meetingId: string; studentNotes: string }, ctx: PortalContext) {
    requireRole(ctx, ["mentor"]);
    if (!meetingId) throw new Error("Meeting ID is required.");
    const db = adminDatabases();
    const meeting = await db.getDocument(databaseId(), meetingsId(), meetingId);
    if (!String(meeting.description || "").includes(MEETING_MARKER)) throw new Error("This is not a roster scheduled meeting.");
    const text = String(studentNotes ?? "").trim();
    // Try saving as a dedicated studentNotes attribute first
    try {
      await db.updateDocument(databaseId(), meetingsId(), meetingId, { studentNotes: text });
    } catch {
      // Attribute may not exist – embed into description as fallback
      const desc = String(meeting.description || "");
      const marker = "\n---STUDENT_NOTES---\n";
      const cpMarker = "\n---COMMON_POINTS---\n";
      // Preserve everything before STUDENT_NOTES marker (but also before COMMON_POINTS if it comes after)
      let base = desc;
      if (base.includes(marker)) base = base.slice(0, base.indexOf(marker));
      // If common points marker exists, preserve it and content after it
      let cpSuffix = "";
      if (desc.includes(cpMarker)) {
        const cpIndex = desc.indexOf(cpMarker);
        if (base.includes(cpMarker)) {
          base = base.slice(0, cpIndex);
        }
        cpSuffix = desc.slice(cpIndex);
        // Remove student notes from cpSuffix if embedded there
        if (cpSuffix.includes(marker)) cpSuffix = cpSuffix.slice(0, cpSuffix.indexOf(marker));
      }
      await db.updateDocument(databaseId(), meetingsId(), meetingId, { description: base + marker + text + cpSuffix });
    }
    return { success: true };
  }

  static async uploadAcademicRecord({ studentId, form }: { studentId: string; form: any }, ctx: PortalContext) {
    if (ctx.profile.$id !== studentId) throw new Error("You can only update your own profile.");
    const spi = Number(form.spi);
    const cpi = Number(form.cpi);
    if (isNaN(spi) || spi < 0 || spi > 10) throw new Error("SPI must be between 0 and 10.");
    if (isNaN(cpi) || cpi < 0 || cpi > 10) throw new Error("CPI must be between 0 and 10.");

    const fileId = await uploadFile(form.file, { required: true, maxBytes: 5 * 1024 * 1024, allowedTypes: ["application/pdf", "image/jpeg", "image/png"] });
    const record = await adminDatabases().createDocument(databaseId(), academicsId(), ID.unique(), {
      studentId,
      semester: form.semester,
      spi: form.spi,
      cpi: form.cpi,
      fileId,
      status: "Pending",
    });
    await notifyAssignedMentor(studentId, `A mentee submitted Semester ${form.semester} academic records for approval.`, "academic_submission", record.$id);
    return { success: true };
  }

  static async updateAcademicStatus({ recordId, newStatus, studentId }: { recordId: string; newStatus: string; studentId: string }, ctx: PortalContext) {
    const db = adminDatabases();
    const record = await db.getDocument(databaseId(), academicsId(), recordId);
    if (record.studentId !== studentId) throw new Error("Academic record and student do not match.");
    await requireAssignedMentor(ctx, studentId);
    await db.updateDocument(databaseId(), academicsId(), recordId, { status: newStatus });
    await createNotification(studentId, `Your academic record has been ${newStatus.toLowerCase()} by your mentor.`, "academic_status", recordId);
    return { success: true };
  }

  static async uploadAchievement({ studentId, form }: { studentId: string; form: any }, ctx: PortalContext) {
    if (ctx.profile.$id !== studentId) throw new Error("You can only update your own profile.");
    const fileId = await uploadFile(form.file, { required: false, maxBytes: 5 * 1024 * 1024, allowedTypes: ["application/pdf", "image/jpeg", "image/png"] });
    const achievement = await adminDatabases().createDocument(databaseId(), achievementsId(), ID.unique(), {
      studentId,
      title: form.title,
      category: form.category,
      description: form.description,
      fileId,
      status: "Pending",
    });
    await notifyAssignedMentor(studentId, `A mentee submitted "${form.title}" for achievement approval.`, "achievement_submission", achievement.$id);
    return { success: true };
  }

  static async updateAchievementStatus({ achievementId, newStatus, studentId }: { achievementId: string; newStatus: string; studentId: string }, ctx: PortalContext) {
    const db = adminDatabases();
    const achievement = await db.getDocument(databaseId(), achievementsId(), achievementId);
    if (achievement.studentId !== studentId) throw new Error("Achievement and student do not match.");
    await requireAssignedMentor(ctx, studentId);
    await db.updateDocument(databaseId(), achievementsId(), achievementId, { status: newStatus });
    await createNotification(studentId, `Your achievement has been ${newStatus.toLowerCase()} by your mentor.`, "achievement_status", achievementId);
    return { success: true };
  }

  static async updateProfileDetails({ profileId, department, skillsString }: { profileId: string; department: string; skillsString: string }, ctx: PortalContext) {
    if (ctx.profile.$id !== profileId) throw new Error("You can only update your own profile.");
    const skills = String(skillsString || "").split(",").map((skill) => skill.trim()).filter(Boolean);
    await adminDatabases().updateDocument(databaseId(), profilesId(), profileId, { department, skills });
    return { success: true };
  }

  static async assignMentor({ studentId, mentorId, verify = false }: { studentId: string; mentorId: string; verify?: boolean }, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const db = adminDatabases();
    const [student, mentor] = await Promise.all([getProfile(studentId), getProfile(mentorId)]);
    if (student.role !== "mentee" || mentor.role !== "mentor") throw new Error("Please select a valid student and mentor.");
    await db.updateDocument(databaseId(), profilesId(), studentId, { mentorId, ...(verify ? { isVerified: true } : {}) });
    return { success: true };
  }

  static async bulkImportStudents({ studentList }: { studentList: Array<{ fullName: string; email: string; department: string }> }, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const client = createAdminClient();
    const db = new Databases(client);
    const users = new Users(client);
    let successCount = 0;
    const errors: string[] = [];
    for (const student of studentList) {
      try {
        const emailLower = student.email.toLowerCase().trim();
        await users.create(ID.unique(), emailLower, undefined, "Pdeu@2026", student.fullName.trim());
        await db.createDocument(databaseId(), profilesId(), ID.unique(), {
          email: emailLower,
          fullName: student.fullName.trim(),
          department: student.department.trim(),
          role: "mentee",
          isVerified: true,
        });
        successCount += 1;
      } catch (error: any) {
        errors.push(`Failed for ${student.email}: ${error.message}`);
      }
    }
    return { success: true, successCount, errors };
  }

  static async getAssignedMentees({ mentorId }: { mentorId: string }, ctx: PortalContext) {
    if (ctx.profile.role === "mentor" && ctx.profile.$id !== mentorId) throw new Error("You can only access your own mentor workspace.");
    const roster = await adminDatabases().listDocuments(databaseId(), profilesId(), [Query.equal("mentorId", [mentorId]), Query.equal("role", ["mentee"]), Query.orderDesc("$createdAt")]);
    return asJson(roster.documents);
  }

  static async getPendingApprovals({ mentorId }: { mentorId: string }, ctx: PortalContext) {
    if (ctx.profile.role === "mentor" && ctx.profile.$id !== mentorId) throw new Error("You can only access your own mentor workspace.");
    const db = adminDatabases();
    const mentees = await db.listDocuments(databaseId(), profilesId(), [Query.equal("mentorId", [mentorId]), Query.limit(100)]);
    if (mentees.total === 0) return { meetings: [], meetingRequests: [], academics: [], achievements: [] };
    const menteeIds = mentees.documents.map((doc) => doc.$id);
    const studentMap = Object.fromEntries(mentees.documents.map((doc) => [doc.$id, doc.fullName || "Unknown Student"]));
    const [meetings, requests, academics, achievements] = await Promise.all([
      db.listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(100)]),
      db.listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", menteeIds), Query.equal("status", ["Requested"]), Query.orderDesc("$createdAt"), Query.limit(100)]),
      db.listDocuments(databaseId(), academicsId(), [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(100)]),
      db.listDocuments(databaseId(), achievementsId(), [Query.equal("studentId", menteeIds), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(100)]),
    ]);
    const withNames = (docs: any[]) => docs.map((doc) => ({ ...doc, studentName: studentMap[doc.studentId] || "Unknown Student" }));
    return asJson({ meetings: withNames(meetings.documents), meetingRequests: withNames(requests.documents), academics: withNames(academics.documents), achievements: withNames(achievements.documents) });
  }

  static async toggleStudentVerification({ studentId, currentStatus }: { studentId: string; currentStatus: boolean }, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    await adminDatabases().updateDocument(databaseId(), profilesId(), studentId, { isVerified: !currentStatus });
    return { success: true };
  }

  static async getSystemAnalytics(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const db = adminDatabases();
    const [mentees, verified, meetings] = await Promise.all([
      db.listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"])]),
      db.listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"]), Query.equal("isVerified", [true])]),
      db.listDocuments(databaseId(), meetingsId()),
    ]);
    return { totalStudents: mentees.total, verifiedStudents: verified.total, pendingVerifications: mentees.total - verified.total, totalMeetings: meetings.total };
  }

  static async createGlobalNotice({ title, content }: { title: string; content: string }, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    await adminDatabases().createDocument(databaseId(), noticesId(), ID.unique(), { title, content });
    return { success: true };
  }

  static async getAllMentors(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const mentors = await adminDatabases().listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentor"]), Query.orderDesc("$createdAt")]);
    return asJson(mentors.documents);
  }

  static async getVerifiedStudentsForExport(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const students = await adminDatabases().listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"]), Query.equal("isVerified", [true])]);
    return asJson(students.documents.map((student) => ({
      FullName: student.fullName,
      RollNumber: student.rollNo || "N/A",
      Email: student.email,
      Department: student.department,
      CurrentSemester: student.currentSemester || "N/A",
    })));
  }

  static async getAllProfiles(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const profiles = await adminDatabases().listDocuments(databaseId(), profilesId(), [Query.orderDesc("$createdAt")]);
    return asJson(profiles.documents);
  }

  static async deleteUserProfile({ profileId }: { profileId: string }, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    if (ctx.profile.$id === profileId || ctx.user.$id === profileId) throw new Error("You cannot delete your own account.");
    await adminDatabases().deleteDocument(databaseId(), profilesId(), profileId);
    return { success: true };
  }

  static async getGlobalSettings(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const db = adminDatabases();
    const settings = await db.listDocuments(databaseId(), settingsId(), [Query.limit(1)]);
    if (settings.total === 0) {
      return asJson(await db.createDocument(databaseId(), settingsId(), ID.unique(), { activeTerm: "Odd Semesters (July-Dec)", academicYear: "2026-2027" }));
    }
    return asJson(settings.documents[0]);
  }

  static async updateGlobalSettings({ settingsId: documentId, activeTerm, academicYear }: { settingsId: string; activeTerm: string; academicYear: string }, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    await adminDatabases().updateDocument(databaseId(), settingsId(), documentId, { activeTerm, academicYear });
    return { success: true };
  }

  static async getDepartmentAnalytics(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const profiles = await adminDatabases().listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"])]);
    const stats: Record<string, { total: number; verified: number }> = {};
    profiles.documents.forEach((student) => {
      const department = student.department || "Unassigned";
      stats[department] ||= { total: 0, verified: 0 };
      stats[department].total += 1;
      if (student.isVerified) stats[department].verified += 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, Total: value.total, Verified: value.verified }));
  }

  static async getUnassignedStudents(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const mentees = await adminDatabases().listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"]), Query.orderDesc("$createdAt")]);
    return asJson(mentees.documents.filter((student) => !student.mentorId || student.mentorId === ""));
  }

  static async importStudentsFromCSV({ text }: { text: string }, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const db = adminDatabases();
    const lines = String(text || "").split(/\r?\n/).filter((line) => line.trim());
    for (let i = 1; i < lines.length; i += 1) {
      const [fullName, email, department] = lines[i].split(",").map((item) => item.trim());
      if (!fullName || !email) continue;
      await db.createDocument(databaseId(), profilesId(), ID.unique(), { fullName, email, department: department || "Unassigned", role: "mentee", isVerified: true });
    }
    return { success: true };
  }

  static async getSystemActivityLog(_payload: unknown, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const db = adminDatabases();
    const [notices, profiles] = await Promise.all([
      db.listDocuments(databaseId(), noticesId(), [Query.orderDesc("$createdAt"), Query.limit(3)]),
      db.listDocuments(databaseId(), profilesId(), [Query.orderDesc("$createdAt"), Query.limit(4)]),
    ]);
    const logs: any[] = [];
    notices.documents.forEach((notice) => logs.push({ id: notice.$id, type: "notice", message: `Global Notice published: "${notice.title}"`, timestamp: notice.$createdAt, icon: "notice", color: "bg-blue-100 text-blue-600" }));
    profiles.documents.forEach((profile) => logs.push({ id: profile.$id, type: "user", message: profile.mentorId ? `${profile.fullName} was assigned a mentor.` : `New student account created: ${profile.fullName}`, timestamp: profile.$createdAt, icon: profile.mentorId ? "assignment" : "user", color: profile.mentorId ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600" }));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  }

  static async getMentorRoster({ mentorId }: { mentorId: string }, ctx: PortalContext) {
    if (ctx.profile.role === "mentor" && ctx.profile.$id !== mentorId) throw new Error("You can only access your own mentor workspace.");
    const db = adminDatabases();
    const mentees = await db.listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentee"]), Query.equal("mentorId", mentorId), Query.orderDesc("$createdAt"), Query.limit(100)]);
    if (mentees.total === 0) return [];
    const ids = mentees.documents.map((mentee) => mentee.$id);
    const academics = await db.listDocuments(databaseId(), academicsId(), [Query.equal("studentId", ids), Query.equal("status", ["Verified"]), Query.orderDesc("$createdAt"), Query.limit(100)]).catch(() => ({ documents: [] as any[] }));
    const latest = academics.documents.reduce((acc: any, record: any) => {
      if (record.studentId && !acc[record.studentId]) acc[record.studentId] = record;
      return acc;
    }, {});
    return asJson(mentees.documents.map((mentee) => {
      const record = latest[mentee.$id];
      const profileCgpa = Number(mentee.cgpa || 0);
      const latestCpi = Number(record?.cpi || 0);
      const latestSpi = Number(record?.spi || 0);
      const performanceScore = latestCpi || profileCgpa || latestSpi || 0;
      return { ...mentee, latestCpi: record?.cpi || "", latestSpi: record?.spi || "", latestAcademicSemester: record?.semester || "", performanceScore, performanceSource: latestCpi ? "Latest CPI" : profileCgpa ? "Profile CGPA" : latestSpi ? "Latest SPI" : "No verified score" };
    }));
  }

  static async completeMenteeOnboarding({ userId, form }: { userId: string; form: any }, ctx: PortalContext) {
    if (ctx.profile.$id !== userId) throw new Error("You can only update your own profile.");
    if (form.cgpa) {
      const cgpa = Number(form.cgpa);
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) throw new Error("CGPA must be between 0 and 10.");
    }
    const profilePictureId = await uploadFile(form.profilePicture, { required: false, maxBytes: 2 * 1024 * 1024, allowedTypes: ["image/jpeg", "image/png"] });
    const updateData = { ...form };
    delete updateData.profilePicture;
    if (profilePictureId) updateData.profilePictureId = profilePictureId;
    await adminDatabases().updateDocument(databaseId(), profilesId(), userId, updateData);
    return { success: true };
  }

  static async getLatestAcademicRecord({ studentId }: { studentId: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, studentId);
    const records = await adminDatabases().listDocuments(databaseId(), academicsId(), [Query.equal("studentId", studentId), Query.orderDesc("$createdAt"), Query.limit(1)]);
    return records.documents[0] ? asJson(records.documents[0]) : null;
  }

  static async getAcademicRecordsForProfile({ studentId }: { studentId: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, studentId);
    const records = await adminDatabases().listDocuments(databaseId(), academicsId(), [Query.equal("studentId", studentId), Query.orderDesc("$createdAt")]);
    return asJson(records.documents);
  }

  static async getAchievementRecordsForProfile({ studentId }: { studentId: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, studentId);
    const records = await adminDatabases().listDocuments(databaseId(), achievementsId(), [Query.equal("studentId", studentId), Query.orderDesc("$createdAt")]);
    return asJson(records.documents);
  }

  static async importMasterAdvisoryList({ text }: { text: string }, ctx: PortalContext) {
    requireRole(ctx, ["admin", "coordinator"]);
    const db = adminDatabases();
    const users = new Users(createAdminClient());
    const mentors = await db.listDocuments(databaseId(), profilesId(), [Query.equal("role", ["mentor"])]);
    const lines = String(text || "").split(/\r?\n/);
    let count = 0;
    const errors: string[] = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cols = lines[i].trim().split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((value) => value.replace(/^"|"$/g, "").trim());
      const fullName = cols[1];
      const rollNo = cols[2];
      const facultyName = cols[5];
      if (!fullName || !rollNo) continue;
      let mentorId = "unassigned_mentor";
      if (facultyName) {
        const csvName = facultyName.toLowerCase().replace(/(dr\.|prof\.)?\s*/g, "").trim();
        const mentor = mentors.documents.find((m) => {
          const dbName = String(m.fullName || "").toLowerCase().replace(/(dr\.|prof\.)?\s*/g, "").trim();
          return dbName.includes(csvName) || csvName.includes(dbName);
        });
        if (mentor) mentorId = mentor.$id;
        else errors.push(`Row ${i + 1} (${rollNo}): Mentor '${facultyName}' not found in database. Student marked as Unassigned.`);
      }
      const cleanRollNo = rollNo.toLowerCase().replace(/\s+/g, "");
      const email = `${cleanRollNo}@sot.pdpu.ac.in`;
      const existing = await db.listDocuments(databaseId(), profilesId(), [Query.equal("email", [email])]);
      if (existing.total > 0) {
        errors.push(`Row ${i + 1} (${rollNo}): Student already exists. Skipping.`);
        continue;
      }
      try {
        await users.create(ID.unique(), email, undefined, `Pdeu@${cleanRollNo}`, fullName);
      } catch (error: any) {
        if (error.code !== 409) throw error;
      }
      await db.createDocument(databaseId(), profilesId(), ID.unique(), { fullName, email, rollNo: rollNo.toUpperCase(), department: "Unassigned", role: "mentee", isVerified: true, mentorId });
      count += 1;
    }
    return { success: true, count, errors };
  }

  static async getCurrentUserNotificationState(_payload: unknown, ctx: PortalContext) {
    const db = adminDatabases();
    const recipientIds = Array.from(new Set([ctx.user.$id, ctx.profile.$id]));
    const stored = await db.listDocuments(databaseId(), notificationsId(), [Query.equal("userId", recipientIds), Query.orderDesc("$createdAt"), Query.limit(100)]).catch(() => ({ documents: [] as any[] }));
    const activity = ctx.profile.role === "mentor"
      ? await this.getMentorActivity(ctx.profile.$id, ctx.profile.$id)
      : await this.getMenteeActivity(ctx.profile.$id, ctx.profile.$id);
    const merged = mergeNotifications(asJson(stored.documents), asJson(activity));
    return { notifications: merged, unreadCount: merged.filter((notification) => !notification.isRead).length, userId: ctx.user.$id, profileId: ctx.profile.$id, role: ctx.profile.role };
  }

  private static async getMentorActivity(mentorId: string, feedUserId: string) {
    const pending = await this.getPendingApprovals({ mentorId }, { user: {}, profile: { role: "mentor", $id: mentorId } });
    return [
      ...pending.meetingRequests.map((request: any) => makeActivity(request.$id, feedUserId, `${request.studentName || "A mentee"} requested a meeting${request.proposedDate || request.date ? ` on ${request.proposedDate || request.date}` : ""}${request.proposedTime ? ` at ${request.proposedTime}` : ""}.`, "meeting_request_pending", request.$id, request.$createdAt)),
      ...pending.meetings.map((meeting: any) => makeActivity(meeting.$id, feedUserId, `${meeting.studentName || "A mentee"} submitted a meeting log${meeting.topic ? ` for "${meeting.topic}"` : ""}.`, "meeting_log_submission", meeting.$id, meeting.$createdAt)),
      ...pending.academics.map((record: any) => makeActivity(record.$id, feedUserId, `${record.studentName || "A mentee"} uploaded academic results${record.semester ? ` for Semester ${record.semester}` : ""}.`, "academic_submission", record.$id, record.$createdAt)),
      ...pending.achievements.map((achievement: any) => makeActivity(achievement.$id, feedUserId, `${achievement.studentName || "A mentee"} submitted an achievement${achievement.title ? `: ${achievement.title}` : ""}.`, "achievement_submission", achievement.$id, achievement.$createdAt)),
    ];
  }

  private static async getMenteeActivity(profileId: string, feedUserId: string) {
    const db = adminDatabases();
    const [meetings, academics, achievements] = await Promise.all([
      db.listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", [profileId]), Query.orderDesc("$createdAt"), Query.limit(10)]).catch(() => ({ documents: [] as any[] })),
      db.listDocuments(databaseId(), academicsId(), [Query.equal("studentId", [profileId]), Query.orderDesc("$createdAt"), Query.limit(10)]).catch(() => ({ documents: [] as any[] })),
      db.listDocuments(databaseId(), achievementsId(), [Query.equal("studentId", [profileId]), Query.orderDesc("$createdAt"), Query.limit(10)]).catch(() => ({ documents: [] as any[] })),
    ]);
    return [
      ...meetings.documents.map((meeting: any) => makeActivity(meeting.$id, feedUserId, meeting.status === "Requested" ? `Your meeting request${meeting.proposedDate || meeting.date ? ` for ${meeting.proposedDate || meeting.date}` : ""} is waiting for mentor confirmation.` : meeting.status === "Confirmed" || meeting.status === "Rejected" ? `Your meeting request has been ${String(meeting.status).toLowerCase()}.` : `A meeting${meeting.topic ? ` for "${meeting.topic}"` : ""} is scheduled${meeting.date ? ` on ${meeting.date}` : ""}.`, "meeting_request", meeting.$id, meeting.$createdAt)),
      ...academics.documents.map((record: any) => makeActivity(record.$id, feedUserId, `Your academic record${record.semester ? ` for Semester ${record.semester}` : ""} is ${String(record.status || "Pending").toLowerCase()}.`, "academic_status", record.$id, record.$createdAt)),
      ...achievements.documents.map((achievement: any) => makeActivity(achievement.$id, feedUserId, `Your achievement${achievement.title ? ` "${achievement.title}"` : ""} is ${String(achievement.status || "Pending").toLowerCase()}.`, "achievement_status", achievement.$id, achievement.$createdAt)),
    ];
  }

  static async markNotificationAsRead({ notificationId }: { notificationId: string }, ctx: PortalContext) {
    return this.updateOwnedNotification(notificationId, ctx, { isRead: true });
  }

  static async markAllCurrentUserNotificationsAsRead(_payload: unknown, ctx: PortalContext) {
    const db = adminDatabases();
    const recipientIds = Array.from(new Set([ctx.user.$id, ctx.profile.$id]));
    const notifications = await db.listDocuments(databaseId(), notificationsId(), [Query.equal("userId", recipientIds), Query.limit(100)]);
    await Promise.all(notifications.documents.filter((n) => !n.isRead).map((n) => db.updateDocument(databaseId(), notificationsId(), n.$id, { isRead: true })));
    return { success: true };
  }

  static async deleteCurrentUserNotification({ notificationId }: { notificationId: string }, ctx: PortalContext) {
    const db = adminDatabases();
    const notification = await db.getDocument(databaseId(), notificationsId(), notificationId);
    if (![ctx.user.$id, ctx.profile.$id].includes(notification.userId)) throw new Error("You do not have permission to update this notification.");
    await db.deleteDocument(databaseId(), notificationsId(), notificationId);
    return { success: true };
  }

  private static async updateOwnedNotification(notificationId: string, ctx: PortalContext, data: any) {
    const db = adminDatabases();
    const notification = await db.getDocument(databaseId(), notificationsId(), notificationId);
    if (![ctx.user.$id, ctx.profile.$id].includes(notification.userId)) throw new Error("You do not have permission to update this notification.");
    await db.updateDocument(databaseId(), notificationsId(), notificationId, data);
    return { success: true };
  }

  static async getDashboardOverview({ profileId }: { profileId: string }, ctx: PortalContext) {
    await requireSelfOrAssignedMentor(ctx, profileId);
    const db = adminDatabases();
    const [profile, meetings, requests, academics, achievements, scheduled, latestAcademics] = await Promise.all([
      db.getDocument(databaseId(), profilesId(), profileId).catch(() => null),
      db.listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", profileId), Query.orderDesc("$createdAt"), Query.limit(3)]).catch(() => ({ documents: [] as any[] })),
      db.listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", profileId), Query.equal("status", ["Requested"]), Query.orderDesc("$createdAt"), Query.limit(5)]).catch(() => ({ documents: [] as any[] })),
      db.listDocuments(databaseId(), academicsId(), [Query.equal("studentId", profileId), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(25)]).catch(() => ({ documents: [] as any[] })),
      db.listDocuments(databaseId(), achievementsId(), [Query.equal("studentId", profileId), Query.equal("status", ["Pending"]), Query.orderDesc("$createdAt"), Query.limit(25)]).catch(() => ({ documents: [] as any[] })),
      db.listDocuments(databaseId(), meetingsId(), [Query.equal("studentId", profileId), Query.equal("status", ["Scheduled", "Pending"]), Query.orderDesc("date"), Query.limit(25)]).catch(() => ({ documents: [] as any[] })),
      db.listDocuments(databaseId(), academicsId(), [Query.equal("studentId", profileId), Query.orderDesc("$createdAt"), Query.limit(1)]).catch(() => ({ documents: [] as any[] })),
    ]);
    const mentor = profile?.mentorId ? await getProfile(profile.mentorId).catch(() => null) : null;
    return asJson({
      profile,
      meetings: meetings.documents,
      pendingMeetingRequests: requests.documents,
      pendingAcademicApprovals: academics.documents,
      pendingAchievementApprovals: achievements.documents,
      activeMeetings: scheduled.documents,
      academicData: latestAcademics.documents[0] || null,
      mentor,
      currentProfile: ctx.profile,
    });
  }
}
