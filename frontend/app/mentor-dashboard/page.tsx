export const dynamic = "force-dynamic";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { 
  getLatestNotices, 
  getMentorRoster, 
  getMenteeProfile, 
  getLatestAcademicRecord, 
  getMentorScheduledMeetings, 
  getAcademicRecordsForProfile, 
  getAchievementRecordsForProfile, 
  getPendingApprovals,
  getMentorNote,
  getStudentDirectory
} from "@/lib/actions/student.actions";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import MentorSidebar from "@/components/MentorSidebar";
import MeetingsTabClient from "@/components/MeetingsTabClient";
import AcademicsManager from "@/components/AcademicsManager";
import AchievementsManager from "@/components/AchievementsManager";
import MentorRosterExplorer from "@/components/MentorRosterExplorer";
import MentorRosterCards from "@/components/MentorRosterCards";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import MentorNotesEditor from "@/components/MentorNotesEditor";
import StudentDirectoryTable, { type EnrichedStudent } from "@/components/StudentDirectoryTable";
import { getFileViewUrl } from "@/lib/files";
import type { AcademicUploadRecord, AchievementRecord, Meeting, NoticeRecord, UserProfile } from "@/types";
import { 
  Users, 
  Bell, 
  ChevronLeft, 
  FileText
} from "lucide-react";

export default async function MentorDashboardPage(props: { searchParams: Promise<{ tab?: string, id?: string, q?: string, meetingGroupId?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "dashboard";
  const studentId = searchParams.id;
  const meetingGroupId = searchParams.meetingGroupId;

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const [myMentees, notices, scheduledMeetings, pendingApprovals] = await Promise.all([
    getMentorRoster(user.$id),
    getLatestNotices(5),
    getMentorScheduledMeetings(user.$id),
    getPendingApprovals(user.$id)
  ]);

  let studentDirectory: EnrichedStudent[] = [];
  if (activeTab === "directory") {
    studentDirectory = await getStudentDirectory();
  }
  
  const pendingApprovalCount =
    pendingApprovals.meetings.length +
    pendingApprovals.meetingRequests.length +
    pendingApprovals.academics.length +
    pendingApprovals.achievements.length;

  // Fetch specific student data if the mentor is viewing a profile OR logging a meeting
  let selectedStudent: UserProfile | null = null;
  let latestAcademicRecord: AcademicUploadRecord | null = null;
  let academicRecords: AcademicUploadRecord[] = [];
  let achievementRecords: AchievementRecord[] = [];
  let mentorNote: { content?: string; collectionMissing?: boolean } | null = null;
  if ((activeTab === 'student-profile' || activeTab === 'log-meeting' || activeTab === 'student-academics' || activeTab === 'student-achievements') && studentId) {
    if (activeTab === 'student-profile') {
      const [fetchedStudent, latAcad, noteRes, achRes] = await Promise.all([
        getMenteeProfile(studentId),
        getLatestAcademicRecord(studentId),
        getMentorNote(studentId),
        getAchievementRecordsForProfile(studentId)
      ]);
      selectedStudent = fetchedStudent;
      latestAcademicRecord = latAcad;
      mentorNote = noteRes;
      achievementRecords = achRes;
    } else if (activeTab === 'student-academics') {
      const [fetchedStudent, acadRecs] = await Promise.all([
        getMenteeProfile(studentId),
        getAcademicRecordsForProfile(studentId)
      ]);
      selectedStudent = fetchedStudent;
      academicRecords = acadRecs || [];
    } else if (activeTab === 'student-achievements') {
      const [fetchedStudent, achRecs] = await Promise.all([
        getMenteeProfile(studentId),
        getAchievementRecordsForProfile(studentId)
      ]);
      selectedStudent = fetchedStudent;
      achievementRecords = achRecs || [];
    } else {
      selectedStudent = await getMenteeProfile(studentId);
    }

    if (selectedStudent?.mentorId !== user.$id) {
      selectedStudent = null;
    }
  }

  if ((activeTab === 'student-profile' || activeTab === 'log-meeting' || activeTab === 'student-academics' || activeTab === 'student-achievements') && studentId && !selectedStudent) {
    redirect("/mentor-dashboard");
  }

  const initialNoteContent = mentorNote?.content || "";
  const initialCollectionMissing = !!mentorNote?.collectionMissing;

  const getInitials = (name?: string) => {
    if (!name) return "S";
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const studentMeetings = selectedStudent 
    ? (scheduledMeetings || []).filter((m: Meeting) => m.studentId === selectedStudent.$id || m.studentName === selectedStudent.fullName)
    : [];
  const totalMeetingsCount = studentMeetings.length;

  // Dynamic Header Logic
  let pageTitle = "Dashboard";
  if (activeTab === 'roster') {
    pageTitle = "My Mentees";
  } else if (activeTab === 'notices') {
    pageTitle = "University Notices";
  } else if (activeTab === 'meetings') {
    pageTitle = "Meetings";
  } else if (activeTab === 'student-profile' && selectedStudent) {
    pageTitle = "Student Dossier";
  } else if (activeTab === 'log-meeting' && selectedStudent) {
    pageTitle = "Log Mentorship Session";
  } else if (activeTab === 'student-academics' && selectedStudent) {
    pageTitle = "Academic History";
  } else if (activeTab === 'student-achievements' && selectedStudent) {
    pageTitle = "Achievements";
  } else if (activeTab === 'directory') {
    pageTitle = "Student Directory";
  }

  const activeSidebarItem =
    activeTab === "meetings" || activeTab === "directory" || activeTab === "notices" || activeTab === "dashboard"
      ? activeTab
      : "roster";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-slate-200 selection:text-slate-900">
      <MentorSidebar activeItem={activeSidebarItem} pendingApprovalCount={pendingApprovalCount} userName={user.name} />

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="min-h-screen p-6 lg:p-10 md:ml-64">
        <div className="max-w-6xl mx-auto">
          
          {/* DYNAMIC HEADER & NOTIFICATIONS */}
          <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div>
              {/* Contextual Back Buttons */}
              {activeTab === 'student-profile' && (
                <Link href="?tab=roster" className="text-sm font-semibold text-slate-500 hover:text-slate-900 mb-3 flex items-center gap-1 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back to Roster
                </Link>
              )}
              {activeTab === 'log-meeting' && selectedStudent && (
                <Link href={`?tab=student-profile&id=${selectedStudent.$id}`} className="text-sm font-semibold text-slate-500 hover:text-slate-900 mb-3 flex items-center gap-1 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back to Dossier
                </Link>
              )}
              {(activeTab === 'student-academics' || activeTab === 'student-achievements') && selectedStudent && (
                <Link href={`?tab=student-profile&id=${selectedStudent.$id}`} className="text-sm font-semibold text-slate-500 hover:text-slate-900 mb-3 flex items-center gap-1 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back to Dossier
                </Link>
              )}
              
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
                {activeTab === 'meetings' && meetingGroupId && (
                  <Link 
                    href="?tab=meetings"
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-950 hover:bg-slate-50 transition-all shadow-sm shrink-0 inline-flex items-center justify-center cursor-pointer"
                    title="Back to Meetings List"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                )}
                <span>{pageTitle}</span>
              </h1>
            </div>
            
            <div className="mb-2 lg:mb-0 flex items-center gap-4">
              {(activeTab === 'roster' || (activeTab === 'meetings' && !meetingGroupId)) && <HeaderSearchBar />}
              <NotificationBell />
            </div>
          </div>
          {/* ================= TAB 0: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
              {(!myMentees || myMentees.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No students assigned</h3>
                  <p className="text-slate-500 text-sm">The administration has not assigned any mentees to your roster yet.</p>
                </div>
              ) : (
                <MentorRosterExplorer 
                  mentees={myMentees} 
                  showRosterTable={false} 
                  meetings={scheduledMeetings} 
                  pendingApprovalCount={pendingApprovalCount} 
                  pendingApprovals={pendingApprovals} 
                />
              )}
            </div>
          )}

          {/* ================= TAB 1: MENTEE ROSTER ================= */}
          {activeTab === 'roster' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
              {(!myMentees || myMentees.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No students assigned</h3>
                  <p className="text-slate-500 text-sm">The administration has not assigned any mentees to your roster yet.</p>
                </div>
              ) : (
                <MentorRosterCards mentees={myMentees} searchQuery={searchParams.q || ""} />
              )}
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
              <MeetingsTabClient 
                mentees={myMentees} 
                scheduledMeetings={scheduledMeetings} 
                meetingRequests={pendingApprovals.meetingRequests} 
              />
            </div>
          )}

          {/* ================= TAB 3: GLOBAL NOTICES ================= */}
          {activeTab === 'notices' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-900">Recent Broadcasts</h2>
                  </div>
                </div>
                <div className="p-6">
                  {(!notices || notices.length === 0) ? (
                    <p className="text-center text-slate-500 py-8 text-sm">No notices have been published yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {(notices as NoticeRecord[]).map((notice) => (
                        <div key={notice.$id} className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 border border-slate-200">
                              N
                            </span>
                            <h3 className="font-semibold text-slate-900 text-lg tracking-tight">{notice.title}</h3>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed ml-13">{notice.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 8: STUDENT DIRECTORY ================= */}
          {activeTab === 'directory' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
              <StudentDirectoryTable students={studentDirectory} />
            </div>
          )}

          {/* ================= TAB 4: STUDENT PROFILE DOSSIER ================= */}
          {activeTab === 'student-profile' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both space-y-8 select-none" style={{ animationDelay: "100ms" }}>
              
              {/* --- MAIN GRID SECTION --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
                
                {/* --- LEFT SECTION: GENERAL TEXT DETAILS --- */}
                <div className="md:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 mb-5 border-b border-slate-200 pb-2">Profile Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1.5">
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Course</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.department || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Full Name</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.fullName}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Roll Number</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.rollNo || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Semester</span>
                        <span className="text-slate-900 font-extrabold">Semester {selectedStudent.semester || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Father&apos;s Name</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.fatherName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Mother&apos;s Name</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.motherName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Email Address</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Phone Number</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.phone || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Residential Status</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.residentialStatus || "Day Scholar"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Blood Group</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.bloodGroup || "Unknown"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Father&apos;s Phone</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.fatherPhone || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Mother&apos;s Phone</span>
                        <span className="text-slate-900 font-extrabold">{selectedStudent.motherPhone || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm sm:col-span-2">
                        <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Technical Interests</span>
                        <span className="text-slate-900 font-extrabold text-right max-w-[75%] truncate">{selectedStudent.interests || "No interests specified."}</span>
                      </div>
                    </div>
                  </div>

                  {/* Private Notes Section */}
                  <div className="mt-8">
                    <MentorNotesEditor 
                      studentId={selectedStudent.$id}
                      initialContent={initialNoteContent}
                      initialCollectionMissing={initialCollectionMissing}
                    />
                  </div>
                </div>

                {/* --- RIGHT SECTION: BIG IMAGE, DETAILS & ACTION (Borderless) --- */}
                <div className="md:col-span-1 space-y-4 md:border-l md:border-slate-100 md:pl-10">
                  <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                    {selectedStudent.profilePictureId ? (
                      <img 
                        src={getFileViewUrl(selectedStudent.profilePictureId)}
                        alt={`${selectedStudent.fullName} Profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white text-5xl font-black">
                        {getInitials(selectedStudent.fullName)}
                      </div>
                    )}
                  </div>

                  {/* Student Details under the photo */}
                  <div className="space-y-1.5 pt-2 select-none">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedStudent.fullName}</h2>
                    <div className="flex flex-col gap-1 text-slate-555 text-xs font-semibold">
                      <p>Student ID : <b className="text-slate-800 font-bold">{selectedStudent.rollNo || "N/A"}</b></p>
                      <p>Department : <b className="text-slate-800 font-bold">{selectedStudent.department || "N/A"}</b></p>
                      <div className="pt-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold uppercase text-[9px] tracking-wider border ${
                          selectedStudent.isVerified 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {selectedStudent.isVerified ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Verified
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Pending Verification
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification toggle button sitting cleanly below the photo, only if NOT verified */}
                  {!selectedStudent.isVerified && (
                    <form action={async () => {
                      "use server";
                      const { toggleStudentVerification } = await import("@/lib/actions/student.actions");
                            await toggleStudentVerification(selectedStudent.$id, Boolean(selectedStudent.isVerified));
                    }}>
                      <button 
                        type="submit" 
                        className="w-full py-3 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 border cursor-pointer bg-slate-900 text-white hover:bg-slate-800 border-slate-950 shadow-md"
                      >
                        ✓ Mark as Verified
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* --- BOTTOM SECTION: 3 BORDERLESS STATS COLUMNS --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-200 pt-6">
                
                {/* Academics Stats Block */}
                <div className="flex flex-col justify-between h-40">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Academics</h4>
                    <div className="space-y-1.5 mt-2.5 text-[11px] font-bold text-slate-700">
                      <p>Current CGPA : <span className="text-slate-900 font-extrabold">{selectedStudent.cgpa || "N/A"}</span></p>
                      <p>Latest SPI : <span className="text-slate-900 font-extrabold">{latestAcademicRecord?.spi || "N/A"}</span></p>
                      <p className={Number(selectedStudent.backlogs) > 0 ? "text-rose-500 font-extrabold" : "text-emerald-650"}>
                        Backlogs : {selectedStudent.backlogs || 0}
                      </p>
                    </div>
                  </div>
                  <Link 
                    href={`?tab=student-academics&id=${selectedStudent.$id}`} 
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-750 transition-all flex items-center gap-1 group/link"
                  >
                    View marksheets <span className="transform translate-x-0 group-hover/link:translate-x-1 transition-transform duration-200">&rarr;</span>
                  </Link>
                </div>

                {/* Achievements Stats Block */}
                <div className="flex flex-col justify-between h-40">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Achievements</h4>
                    <div className="space-y-1.5 mt-2.5 text-[11px] font-bold text-slate-700">
                      <p>Total Submissions : <span className="text-slate-900 font-extrabold">{achievementRecords.length || 0}</span></p>
                      <p className="text-purple-650">Categories : Technical, Cultural</p>
                      <p>Verified status : Active</p>
                    </div>
                  </div>
                  <Link 
                    href={`?tab=student-achievements&id=${selectedStudent.$id}`} 
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-750 transition-all flex items-center gap-1 group/link"
                  >
                    View achievements <span className="transform translate-x-0 group-hover/link:translate-x-1 transition-transform duration-200">&rarr;</span>
                  </Link>
                </div>

                {/* Meetings Stats Block */}
                <div className="flex flex-col justify-between h-40">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Meetings Log</h4>
                    <div className="space-y-1.5 mt-2.5 text-[11px] font-bold text-slate-700">
                      <p>Total Sessions : <span className="text-slate-900 font-extrabold">{totalMeetingsCount}</span></p>
                      <p className="text-indigo-650">Last session : {studentMeetings[0]?.date ? new Date(studentMeetings[0].date).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                  <Link 
                    href={`?tab=log-meeting&id=${selectedStudent.$id}`} 
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-750 transition-all flex items-center gap-1 group/link"
                  >
                    Log mentorship session <span className="transform translate-x-0 group-hover/link:translate-x-1 transition-transform duration-200">&rarr;</span>
                  </Link>
                </div>

              </div>

            </div>
          )}

          {/* ================= TAB 5: STUDENT ACADEMIC HISTORY ================= */}
          {activeTab === 'student-academics' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
              <AcademicsManager
                initialRecords={academicRecords}
                profileId={selectedStudent.$id}
                isMentor={true}
              />
            </div>
          )}

          {/* ================= TAB 6: STUDENT ACHIEVEMENTS ================= */}
          {activeTab === 'student-achievements' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
              <AchievementsManager
                initialRecords={achievementRecords}
                profileId={selectedStudent.$id}
                isMentor={true}
              />
            </div>
          )}

          {/* ================= TAB 7: LOG NEW MEETING ================= */}
          {activeTab === 'log-meeting' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-2xl" style={{ animationDelay: "100ms" }}>
            
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-500 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">New Session Record</h3>
                    <p className="text-slate-500 text-sm font-medium mt-0.5">Student: {selectedStudent.fullName}</p>
                  </div>
                </div>

                <form action={async (formData) => {
                  "use server";
                  const { logMeeting } = await import("@/lib/actions/student.actions");
                  
                  await logMeeting({
                    studentId: selectedStudent.$id,
                    date: formData.get("date") as string,
                    topic: formData.get("topic") as string,
                    mentorName: user.name || "Faculty Mentor",
                    description: formData.get("description") as string,
                  });
                  
                  redirect(`?tab=student-profile&id=${selectedStudent.$id}`);
                }} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Meeting Date</label>
                      <input type="date" name="date" required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Discussion Topic</label>
                      <select name="topic" required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all">
                        <option value="">Select a topic...</option>
                        <option value="Academic Guidance">Academic Guidance</option>
                        <option value="Project/Internship">Project & Internships</option>
                        <option value="Career Counseling">Career Counseling</option>
                        <option value="General Check-in">General Check-in</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Session Notes & Action Items</label>
                    <textarea 
                      name="description" 
                      required 
                      rows={5} 
                      placeholder="Discussed strategies for improving CGPA in the upcoming mid-semesters..."
                      className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-sm leading-relaxed"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button type="submit" className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:ring-offset-white">
                      Save Meeting Record
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
