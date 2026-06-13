"use server";

import { revalidatePath } from "next/cache";
import { serverApi } from "@/lib/api-server";
import type { AppData } from "@/types";

type EncodedFile = {
  name: string;
  type: string;
  size: number;
  base64: string;
};

async function portalAction<T = AppData>(action: string, payload: AppData = {}): Promise<T> {
  return serverApi.post<T>("/portal/action", { action, payload });
}

async function encodeFile(file: File | null): Promise<EncodedFile | null> {
  if (!file || file.size === 0 || file.name === "undefined") return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    base64: bytes.toString("base64"),
  };
}

async function formDataToObject(formData: FormData) {
  const payload: Record<string, AppData> = {};
  const keys = Array.from(new Set(Array.from(formData.keys())));

  for (const key of keys) {
    const values = formData.getAll(key);
    const mapped = await Promise.all(values.map(async (value) => (
      value instanceof File ? encodeFile(value) : String(value)
    )));
    const clean = mapped.filter((value) => value !== null);
    payload[key] = clean.length > 1 ? clean : clean[0] ?? "";
  }

  return payload;
}

function okError(error: unknown, fallback: string) {
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

export async function getProfileByEmail(email: string) {
  try {
    return await portalAction("getProfileByEmail", { email });
  } catch {
    return null;
  }
}

export async function getStudentProfile(profileId: string) {
  try {
    return await portalAction("getStudentProfile", { profileId });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export async function createStudentProfile(studentData: AppData) {
  try {
    return await portalAction("createStudentProfile", { studentData });
  } catch (error) {
    return okError(error, "Failed to create profile.");
  }
}

export async function getLatestNotices(limit = 5) {
  try {
    return await portalAction("getLatestNotices", { limit });
  } catch (error) {
    console.error("Failed to fetch notices:", error);
    return [];
  }
}

export async function getAllStudents() {
  try {
    return await portalAction("getAllStudents");
  } catch {
    return [];
  }
}

export async function getAchievements(studentId: string) {
  try {
    return await portalAction("getAchievements", { studentId });
  } catch {
    return [];
  }
}

export async function addAchievement(studentId: string, title: string, category: string) {
  try {
    const result = await portalAction("addAchievement", { studentId, title, category });
    revalidatePath(`/dashboard/${studentId}`);
    return result;
  } catch (error) {
    return okError(error, "Failed to add achievement.");
  }
}

export async function saveAcademics(studentId: string, year: string, gpa: number, documentId?: string) {
  try {
    const result = await portalAction("saveAcademics", { studentId, year, gpa, documentId });
    revalidatePath(`/dashboard/${studentId}`);
    return result;
  } catch (error) {
    return okError(error, "Failed to save academics.");
  }
}

export async function getMeetings(studentId: string) {
  try {
    return await portalAction("getMeetings", { studentId });
  } catch {
    return [];
  }
}

export async function logMeeting(data: {
  studentId: string;
  date: string;
  topic: string;
  mentorName: string;
  description: string;
}) {
  try {
    const result = await portalAction("logMeeting", { data });
    revalidatePath(`/dashboard/${data.studentId}/meetings`);
    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath("/mentor-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to log meeting.");
  }
}

export async function updateMeetingStatus(meetingId: string, newStatus: "Verified" | "Rejected", studentId: string, _formData?: FormData) {
  try {
    const result = await portalAction("updateMeetingStatus", { meetingId, newStatus, studentId });
    revalidatePath(`/mentor-dashboard`);
    revalidatePath(`/dashboard/${studentId}/meetings`);
    revalidatePath(`/dashboard/${studentId}`);
    return result;
  } catch (error) {
    return okError(error, "Failed to update meeting status.");
  }
}

export async function requestMeeting(studentId: string, formData: FormData) {
  try {
    const result = await portalAction("requestMeeting", { studentId, form: await formDataToObject(formData) });
    revalidatePath(`/dashboard/${studentId}`);
    revalidatePath(`/dashboard/${studentId}/meetings`);
    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath("/mentor-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to request meeting.");
  }
}

export async function getMeetingRequests(mentorId: string) {
  try {
    return await portalAction("getMeetingRequests", { mentorId });
  } catch {
    return [];
  }
}

export async function respondToMeetingRequest(meetingId: string, response: "Confirmed" | "Rejected", message?: string) {
  try {
    const result = await portalAction("respondToMeetingRequest", { meetingId, response, message });
    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath("/mentor-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to respond to meeting request.");
  }
}

export async function scheduleMentorMeeting(formData: FormData) {
  try {
    const result = await portalAction("scheduleMentorMeeting", { form: await formDataToObject(formData) });
    revalidatePath("/mentor-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to schedule meeting.");
  }
}

export async function getMentorScheduledMeetings(mentorId: string) {
  try {
    return await portalAction("getMentorScheduledMeetings", { mentorId });
  } catch {
    return [];
  }
}

export async function updateScheduledMeetingAttendance(meetingId: string, studentId: string, attended: boolean) {
  try {
    const result = await portalAction("updateScheduledMeetingAttendance", { meetingId, studentId, attended });
    revalidatePath("/mentor-dashboard");
    revalidatePath(`/dashboard/${studentId}`);
    revalidatePath(`/dashboard/${studentId}/meetings`);
    return result;
  } catch (error) {
    return okError(error, "Failed to update attendance.");
  }
}

export async function updateMeetingCommonPoints(meetingIds: string[], commonPoints: string) {
  try {
    const result = await portalAction("updateMeetingCommonPoints", { meetingIds, commonPoints });
    revalidatePath("/mentor-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to save common points.");
  }
}

export async function updateMeetingStudentNotes(meetingId: string, studentNotes: string) {
  try {
    const result = await portalAction("updateMeetingStudentNotes", { meetingId, studentNotes });
    revalidatePath("/mentor-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to save student notes.");
  }
}

export async function uploadAcademicRecord(formData: FormData, studentId: string) {
  try {
    const result = await portalAction("uploadAcademicRecord", { studentId, form: await formDataToObject(formData) });
    revalidatePath(`/dashboard/${studentId}/academics`);
    revalidatePath("/mentor-dashboard");
    revalidatePath("/mentor-dashboard/approvals");
    return result;
  } catch (error) {
    return okError(error, "Upload failed.");
  }
}

export async function updateAcademicStatus(recordId: string, newStatus: "Verified" | "Rejected", studentId: string, _formData?: FormData) {
  try {
    const result = await portalAction("updateAcademicStatus", { recordId, newStatus, studentId });
    revalidatePath(`/dashboard/${studentId}/academics`);
    revalidatePath(`/dashboard/${studentId}/notifications`);
    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath("/mentor-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Verification failed.");
  }
}

export async function uploadAchievement(formData: FormData, studentId: string) {
  try {
    const result = await portalAction("uploadAchievement", { studentId, form: await formDataToObject(formData) });
    revalidatePath(`/dashboard/${studentId}/achievements`);
    revalidatePath("/mentor-dashboard");
    revalidatePath("/mentor-dashboard/approvals");
    return result;
  } catch (error) {
    return okError(error, "Achievement upload failed.");
  }
}

export async function updateAchievementStatus(achievementId: string, newStatus: "Verified" | "Rejected", studentId: string, _formData?: FormData) {
  try {
    const result = await portalAction("updateAchievementStatus", { achievementId, newStatus, studentId });
    revalidatePath(`/dashboard/${studentId}/achievements`);
    revalidatePath(`/dashboard/${studentId}/notifications`);
    revalidatePath("/mentor-dashboard/approvals");
    revalidatePath("/mentor-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Achievement verification failed.");
  }
}

export async function updateProfileDetails(profileId: string, department: string, skillsString: string) {
  try {
    const result = await portalAction("updateProfileDetails", { profileId, department, skillsString });
    revalidatePath(`/dashboard/${profileId}/profile`);
    revalidatePath(`/dashboard/${profileId}`);
    return result;
  } catch (error) {
    return okError(error, "A server error occurred. Please try again.");
  }
}

export async function assignMentor(studentId: string, mentorId: string) {
  try {
    const result = await portalAction("assignMentor", { studentId, mentorId });
    revalidatePath(`/admin-dashboard`);
    return result;
  } catch (error) {
    return okError(error, "Assignment failed.");
  }
}

export async function bulkImportStudents(studentList: Array<{ fullName: string; email: string; department: string }>) {
  try {
    const result = await portalAction("bulkImportStudents", { studentList });
    revalidatePath(`/admin-dashboard`);
    return result;
  } catch (error) {
    return okError(error, "Bulk import failed.");
  }
}

export async function getAssignedMentees(mentorId: string) {
  try {
    return await portalAction("getAssignedMentees", { mentorId });
  } catch {
    return [];
  }
}

export async function getPendingApprovals(mentorId: string) {
  try {
    return await portalAction("getPendingApprovals", { mentorId });
  } catch {
    return { meetings: [], meetingRequests: [], academics: [], achievements: [] };
  }
}

export async function toggleStudentVerification(studentId: string, currentStatus: boolean) {
  try {
    const result = await portalAction("toggleStudentVerification", { studentId, currentStatus });
    revalidatePath("/mentor-dashboard");
    revalidatePath(`/mentor-dashboard/student/${studentId}`);
    return result;
  } catch (error) {
    return okError(error, "Failed to toggle verification.");
  }
}

export async function getSystemAnalytics() {
  try {
    return await portalAction("getSystemAnalytics");
  } catch {
    return { totalStudents: 0, verifiedStudents: 0, pendingVerifications: 0, totalMeetings: 0 };
  }
}

export async function createGlobalNotice(formData: FormData) {
  try {
    const result = await portalAction("createGlobalNotice", {
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
    });
    revalidatePath("/admin-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to post notice.");
  }
}

export async function getAllMentors() {
  try {
    return await portalAction("getAllMentors");
  } catch {
    return [];
  }
}

export async function getVerifiedStudentsForExport() {
  try {
    return await portalAction("getVerifiedStudentsForExport");
  } catch {
    return [];
  }
}

export async function getAllProfiles() {
  try {
    return await portalAction("getAllProfiles");
  } catch {
    return [];
  }
}

export async function deleteUserProfile(profileId: string) {
  try {
    const result = await portalAction("deleteUserProfile", { profileId });
    revalidatePath("/admin-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to delete profile.");
  }
}

export async function getGlobalSettings() {
  try {
    return await portalAction("getGlobalSettings");
  } catch {
    return null;
  }
}

export async function updateGlobalSettings(settingsId: string, formData: FormData) {
  try {
    const result = await portalAction("updateGlobalSettings", {
      settingsId,
      activeTerm: String(formData.get("activeTerm") || ""),
      academicYear: String(formData.get("academicYear") || ""),
    });
    revalidatePath("/admin-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to update settings.");
  }
}

export async function getDepartmentAnalytics() {
  try {
    return await portalAction("getDepartmentAnalytics");
  } catch {
    return [];
  }
}

export async function getUnassignedStudents() {
  try {
    return await portalAction("getUnassignedStudents");
  } catch {
    return [];
  }
}

export async function assignMentorToStudent(studentId: string, formData: FormData) {
  try {
    const result = await portalAction("assignMentor", {
      studentId,
      mentorId: String(formData.get("mentorId") || ""),
      verify: true,
    });
    revalidatePath("/admin-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to assign mentor.");
  }
}

export async function importStudentsFromCSV(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) throw new Error("Please select a valid CSV file.");
    if (file.size > 2 * 1024 * 1024) throw new Error("CSV file must be 2MB or smaller.");
    const result = await portalAction("importStudentsFromCSV", { text: await file.text() });
    revalidatePath("/admin-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Failed to import CSV.");
  }
}

export async function getSystemActivityLog() {
  try {
    return await portalAction("getSystemActivityLog");
  } catch {
    return [];
  }
}

export async function getMentorRoster(mentorId: string) {
  try {
    return await portalAction("getMentorRoster", { mentorId });
  } catch {
    return [];
  }
}

export async function completeMenteeOnboarding(userId: string, formData: FormData) {
  try {
    const result = await portalAction("completeMenteeOnboarding", { userId, form: await formDataToObject(formData) });
    revalidatePath(`/dashboard/${userId}`);
    return result;
  } catch (error) {
    return okError(error, "Failed to save onboarding data.");
  }
}

export async function getMenteeProfile(userId: string) {
  try {
    return await portalAction("getMenteeProfile", { userId });
  } catch {
    return null;
  }
}

export async function getLatestAcademicRecord(studentId: string) {
  try {
    return await portalAction("getLatestAcademicRecord", { studentId });
  } catch {
    return null;
  }
}

export async function getAcademicRecordsForProfile(studentId: string) {
  try {
    return await portalAction("getAcademicRecordsForProfile", { studentId });
  } catch {
    return [];
  }
}

export async function getAchievementRecordsForProfile(studentId: string) {
  try {
    return await portalAction("getAchievementRecordsForProfile", { studentId });
  } catch {
    return [];
  }
}

export async function importMasterAdvisoryList(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) throw new Error("Please select a valid CSV file.");
    if (file.size > 2 * 1024 * 1024) throw new Error("CSV file must be 2MB or smaller.");
    const result = await portalAction("importMasterAdvisoryList", { text: await file.text() });
    revalidatePath("/admin-dashboard");
    return result;
  } catch (error) {
    return okError(error, "Master import failed.");
  }
}

export async function checkUserRole(email: string) {
  try {
    return await portalAction("checkUserRole", { email });
  } catch {
    return null;
  }
}

export async function getCurrentUserNotificationState() {
  try {
    return await portalAction("getCurrentUserNotificationState");
  } catch {
    return { notifications: [], unreadCount: 0, userId: null, profileId: null, role: null };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    return await portalAction("markNotificationAsRead", { notificationId });
  } catch {
    return { success: false };
  }
}

export async function markAllCurrentUserNotificationsAsRead() {
  try {
    return await portalAction("markAllCurrentUserNotificationsAsRead");
  } catch {
    return { success: false };
  }
}

export async function deleteCurrentUserNotification(notificationId: string) {
  try {
    return await portalAction("deleteCurrentUserNotification", { notificationId });
  } catch {
    return { success: false };
  }
}

export async function getDashboardOverview(profileId: string) {
  try {
    return await portalAction("getDashboardOverview", { profileId });
  } catch (error) {
    console.error("Dashboard overview data fetch failed:", error);
    return null;
  }
}
