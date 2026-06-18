export const dynamic = "force-dynamic";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { 
  getLatestNotices, 
  getMentorRoster, 
  getMenteeProfile, 
  getLatestAcademicRecord, 
  getMentorScheduledMeetings, 
  getAcademicRecordsForProfile, 
  getAchievementRecordsForProfile, 
  getPendingApprovals 
} from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import MentorMeetingScheduler from "@/components/MentorMeetingScheduler";
import MentorScheduledMeetings from "@/components/MentorScheduledMeetings";
import AcademicsManager from "@/components/AcademicsManager";
import AchievementsManager from "@/components/AchievementsManager";
import MentorRosterExplorer from "@/components/MentorRosterExplorer";
import { getFileViewUrl } from "@/lib/files";
import type { NoticeRecord } from "@/types";
import { 
  Users, 
  CalendarDays, 
  CheckSquare, 
  Bell, 
  ChevronLeft, 
  GraduationCap, 
  UserCircle, 
  Activity,
  MapPin,
  Phone,
  FileText
} from "lucide-react";

export default async function MentorDashboardPage(props: { searchParams: Promise<{ tab?: string, id?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "roster";
  const studentId = searchParams.id;

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const [myMentees, notices, scheduledMeetings, pendingApprovals] = await Promise.all([
    getMentorRoster(user.$id),
    getLatestNotices(5),
    getMentorScheduledMeetings(user.$id),
    getPendingApprovals(user.$id)
  ]);
  
  const pendingApprovalCount =
    pendingApprovals.meetings.length +
    pendingApprovals.meetingRequests.length +
    pendingApprovals.academics.length +
    pendingApprovals.achievements.length;

  // Fetch specific student data if the mentor is viewing a profile OR logging a meeting
  let selectedStudent = null;
  let latestAcademicRecord = null;
  let academicRecords = [];
  let achievementRecords = [];
  if ((activeTab === 'student-profile' || activeTab === 'log-meeting' || activeTab === 'student-academics' || activeTab === 'student-achievements') && studentId) {
    selectedStudent = await getMenteeProfile(studentId);
    if (selectedStudent?.mentorId !== user.$id) {
      selectedStudent = null;
    }
    if (selectedStudent && activeTab === 'student-profile') {
      latestAcademicRecord = await getLatestAcademicRecord(studentId);
    } else if (selectedStudent && activeTab === 'student-academics') {
      academicRecords = await getAcademicRecordsForProfile(studentId);
    } else if (selectedStudent && activeTab === 'student-achievements') {
      achievementRecords = await getAchievementRecordsForProfile(studentId);
    }
  }

  if ((activeTab === 'student-profile' || activeTab === 'log-meeting' || activeTab === 'student-academics' || activeTab === 'student-achievements') && studentId && !selectedStudent) {
    redirect("/mentor-dashboard");
  }

  // Dynamic Header Logic
  let pageTitle = "Mentee Roster";
  let pageDesc = "Manage your assigned students and track their progress.";
  if (activeTab === 'notices') {
    pageTitle = "University Notices";
    pageDesc = "Important updates and deadlines from the administration.";
  } else if (activeTab === 'meetings') {
    pageTitle = "Meetings";
    pageDesc = "Schedule roster meetings and mark which mentees attended.";
  } else if (activeTab === 'student-profile' && selectedStudent) {
    pageTitle = "Student Dossier";
    pageDesc = `Detailed academic and personal profile for ${selectedStudent.fullName}.`;
  } else if (activeTab === 'log-meeting' && selectedStudent) {
    pageTitle = "Log Mentorship Session";
    pageDesc = `Record a new meeting with ${selectedStudent.fullName}.`;
  } else if (activeTab === 'student-academics' && selectedStudent) {
    pageTitle = "Academic History";
    pageDesc = `Academic records submitted by ${selectedStudent.fullName}.`;
  } else if (activeTab === 'student-achievements' && selectedStudent) {
    pageTitle = "Achievements";
    pageDesc = `Achievement records submitted by ${selectedStudent.fullName}.`;
  }

  const isRosterActive = activeTab === 'roster' || activeTab === 'student-profile' || activeTab === 'log-meeting' || activeTab === 'student-academics' || activeTab === 'student-achievements';

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-slate-200 selection:text-slate-900">
      
      {/* ================= FULL-HEIGHT SIDEBAR ================= */}
      <aside className="fixed top-0 left-0 z-20 hidden h-screen w-[17rem] flex-col border-r border-slate-200 bg-white md:flex">
        
        {/* BRANDING LOGO */}
        <div className="flex h-24 shrink-0 items-center gap-4 border-b border-slate-100 px-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xl font-black text-white shadow-md">
            P
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-lg font-bold tracking-tight text-slate-900 leading-tight">PDEU Portal</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5 leading-tight">Faculty Workspace</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 pt-6">
          <Link 
            href="?tab=roster" 
            className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium ${isRosterActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <div className="flex items-center">
              <Users className={`w-5 h-5 mr-3 transition-colors ${isRosterActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span>My Mentees</span>
            </div>
            {myMentees && myMentees.length > 0 && (
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold shadow-sm ${
                isRosterActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {myMentees.length}
              </span>
            )}
          </Link>

          <Link 
            href="?tab=meetings" 
            className={`group flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium ${activeTab === 'meetings' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <CalendarDays className={`w-5 h-5 mr-3 transition-colors ${activeTab === 'meetings' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
            Meetings
          </Link>

          <Link 
            href="/mentor-dashboard/approvals" 
            className="group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <div className="flex items-center">
              <CheckSquare className="w-5 h-5 mr-3 transition-colors text-slate-400 group-hover:text-slate-600" />
              <span>Pending Approvals</span>
            </div>
            {pendingApprovalCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white shadow-sm">
                {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
              </span>
            )}
          </Link>

          <Link 
            href="?tab=notices" 
            className={`group flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium ${activeTab === 'notices' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Bell className={`w-5 h-5 mr-3 transition-colors ${activeTab === 'notices' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
            Global Notices
          </Link>
        </nav>
        
        {/* USER PROFILE & LOGOUT */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-slate-900">{user.name || "Faculty Member"}</span>
                <span className="truncate text-xs text-slate-500 font-medium">Mentor Account</span>
              </div>
           </div>
           <div className="px-1"><LogoutButton /></div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="min-h-screen p-6 lg:p-10 md:ml-[17rem]">
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
              
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {pageTitle}
              </h1>
              <p className="mt-1.5 text-sm font-medium text-slate-500">
                {pageDesc}
              </p>
            </div>
            
            <div className="mb-2 lg:mb-0">
              <NotificationBell />
            </div>
          </div>

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
                <MentorRosterExplorer mentees={myMentees} />
              )}
            </div>
          )}

          {/* ================= TAB 2: MEETINGS ================= */}
          {activeTab === 'meetings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both space-y-6" style={{ animationDelay: "100ms" }}>
              <MentorMeetingScheduler mentees={myMentees} />
              <MentorScheduledMeetings meetings={scheduledMeetings} />
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

          {/* ================= TAB 4: STUDENT PROFILE DOSSIER ================= */}
          {activeTab === 'student-profile' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both space-y-6" style={{ animationDelay: "100ms" }}>
              
              {/* Profile Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm gap-4">
                 <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xl font-bold text-slate-400 border border-slate-200">
                      {selectedStudent.profilePictureId ? (
                        <img 
                          src={getFileViewUrl(selectedStudent.profilePictureId)}
                          alt={`${selectedStudent.fullName} Profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedStudent.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{selectedStudent.fullName}</h2>
                      <p className="text-slate-500 text-sm font-medium mt-0.5">{selectedStudent.email}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                         <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                           {selectedStudent.department || "N/A"}
                         </span>
                         <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200">
                           Verified Student
                         </span>
                      </div>
                    </div>
                 </div>
                 
                 <Link 
                    href={`?tab=log-meeting&id=${selectedStudent.$id}`}
                    className="shrink-0 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 text-center"
                 >
                    Log New Session
                 </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 {/* Academic Overview */}
                 <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-semibold text-slate-900">
                      <GraduationCap className="w-4 h-4 text-slate-400" /> Academic Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Roll Number</p>
                         <p className="font-semibold text-slate-900 text-sm">{selectedStudent.rollNo || "Not Provided"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Current Semester</p>
                         <p className="font-semibold text-slate-900 text-sm">Semester {selectedStudent.semester || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Current CGPA</p>
                         <p className="font-semibold text-slate-900 text-lg">{selectedStudent.cgpa || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Latest SPI</p>
                         <p className="font-semibold text-slate-900 text-lg">{latestAcademicRecord?.spi || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Latest CPI</p>
                         <p className="font-semibold text-slate-900 text-lg">{latestAcademicRecord?.cpi || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Active Backlogs</p>
                         <p className={`font-semibold text-lg ${Number(selectedStudent.backlogs) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                           {selectedStudent.backlogs || "0"}
                         </p>
                       </div>
                       <div className="col-span-2">
                         <p className="text-xs font-medium text-slate-500 mb-1">Technical Interests</p>
                         <p className="font-medium text-slate-800 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedStudent.interests || "None listed."}</p>
                       </div>
                       <div className="col-span-2">
                         <p className="text-xs font-medium text-slate-500 mb-1">Last Uploaded Record</p>
                         <p className="font-medium text-slate-800 text-sm">
                           {latestAcademicRecord?.semester
                             ? `Semester ${latestAcademicRecord.semester} - SPI ${latestAcademicRecord.spi || "N/A"}, CPI ${latestAcademicRecord.cpi || "N/A"}`
                             : "No academic record uploaded yet."}
                         </p>
                       </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-5">
                       <Link 
                          href={`?tab=student-academics&id=${selectedStudent.$id}`}
                          className="text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-colors bg-slate-50 px-4 py-2 rounded-lg border border-slate-200"
                       >
                          <FileText className="w-4 h-4" /> View Full History
                       </Link>
                       <Link 
                          href={`?tab=student-achievements&id=${selectedStudent.$id}`}
                          className="text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-colors bg-slate-50 px-4 py-2 rounded-lg border border-slate-200"
                       >
                          <Activity className="w-4 h-4" /> View Achievements
                       </Link>
                    </div>
                 </div>

                 {/* Logistics */}
                 <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-semibold text-slate-900">
                      <MapPin className="w-4 h-4 text-slate-400" /> Logistics
                    </h3>
                    <div className="space-y-5">
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Blood Group</p>
                         <div className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold rounded-md border border-amber-200 text-sm">
                           {selectedStudent.bloodGroup || "Unknown"}
                         </div>
                       </div>
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Housing Status</p>
                         <p className="font-semibold text-slate-900 text-sm">{selectedStudent.residentialStatus || "Day Scholar"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-medium text-slate-500 mb-1">Student Phone</p>
                         <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                           <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedStudent.phone || "N/A"}
                         </p>
                       </div>
                    </div>
                 </div>

                 {/* Emergency Contacts */}
                 <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
                    <h3 className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-semibold text-slate-900">
                      <UserCircle className="w-4 h-4 text-slate-400" /> Emergency & Guardian Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                          <h4 className="font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2 text-sm">Father&apos;s Details</h4>
                          <div className="space-y-3">
                             <p className="text-sm flex justify-between"><span className="font-medium text-slate-500">Name:</span> <span className="text-slate-900 font-medium">{selectedStudent.fatherName || "N/A"}</span></p>
                             <p className="text-sm flex justify-between"><span className="font-medium text-slate-500">Phone:</span> <span className="text-slate-900 font-medium">{selectedStudent.fatherPhone || "N/A"}</span></p>
                             <p className="text-sm flex justify-between"><span className="font-medium text-slate-500">Email:</span> <span className="text-slate-900 font-medium">{selectedStudent.fatherEmail || "N/A"}</span></p>
                             <p className="text-sm flex justify-between"><span className="font-medium text-slate-500">Occupation:</span> <span className="text-slate-900 font-medium">{selectedStudent.fatherOccupation || "N/A"}</span></p>
                          </div>
                       </div>
                       <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                          <h4 className="font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2 text-sm">Mother&apos;s Details</h4>
                          <div className="space-y-3">
                             <p className="text-sm flex justify-between"><span className="font-medium text-slate-500">Name:</span> <span className="text-slate-900 font-medium">{selectedStudent.motherName || "N/A"}</span></p>
                             <p className="text-sm flex justify-between"><span className="font-medium text-slate-500">Phone:</span> <span className="text-slate-900 font-medium">{selectedStudent.motherPhone || "N/A"}</span></p>
                             <p className="text-sm flex justify-between"><span className="font-medium text-slate-500">Email:</span> <span className="text-slate-900 font-medium">{selectedStudent.motherEmail || "N/A"}</span></p>
                             <p className="text-sm flex justify-between"><span className="font-medium text-slate-500">Occupation:</span> <span className="text-slate-900 font-medium">{selectedStudent.motherOccupation || "N/A"}</span></p>
                          </div>
                       </div>
                    </div>
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