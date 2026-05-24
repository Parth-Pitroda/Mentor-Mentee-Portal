export const dynamic = "force-dynamic";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getLatestNotices, getMentorRoster, getMenteeProfile, getLatestAcademicRecord, getMentorScheduledMeetings, getAcademicRecordsForProfile, getAchievementRecordsForProfile, getPendingApprovals } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import PortalTopNavbar from "@/components/PortalTopNavbar";
import MentorMeetingScheduler from "@/components/MentorMeetingScheduler";
import MentorScheduledMeetings from "@/components/MentorScheduledMeetings";
import AcademicsManager from "@/components/AcademicsManager";
import AchievementsManager from "@/components/AchievementsManager";
import MentorRosterExplorer from "@/components/MentorRosterExplorer";

export default async function MentorDashboardPage(props: { searchParams: Promise<{ tab?: string, id?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "roster";
  const studentId = searchParams.id;

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // Fetch data specific to this mentor
  const myMentees = await getMentorRoster(user.$id);
  const notices = await getLatestNotices(5);
  const scheduledMeetings = await getMentorScheduledMeetings(user.$id);
  const pendingApprovals = await getPendingApprovals(user.$id);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalTopNavbar userName={user.name || "Faculty Mentor"} userEmail={user.email} />
      
      {/* ================= SIDEBAR ================= */}
      <aside className="fixed top-16 z-20 hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">Faculty Dashboard</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="?tab=roster" 
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'roster' || activeTab === 'student-profile' || activeTab === 'log-meeting' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
          >
            My Mentees
          </Link>
          <Link 
            href="?tab=meetings" 
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'meetings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
          >
            Meetings
          </Link>
          <Link 
            href="/mentor-dashboard/approvals" 
            className={`flex items-center justify-between gap-3 px-4 py-2 rounded-lg font-medium transition-all text-slate-600 hover:bg-slate-50 hover:text-blue-700`}
          >
            <span>Pending Approvals</span>
            {pendingApprovalCount > 0 && (
              <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black leading-none text-white">
                {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
              </span>
            )}
          </Link>
          <Link 
            href="?tab=notices" 
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'notices' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
          >
            Global Notices
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-purple-200">
                {user.name ? user.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-slate-800 truncate">{user.name || "Faculty Member"}</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">Mentor</span>
              </div>
           </div>
           <div className="px-1"><LogoutButton /></div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="min-h-screen p-8 pt-24 md:ml-64">
        <div className="max-w-6xl mx-auto">
          
          {/* DYNAMIC HEADER & NOTIFICATIONS */}
          <div className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              {/* Show 'Back to Roster' ONLY on the profile page */}
              {activeTab === 'student-profile' && (
                <Link href="?tab=roster" className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 transition-colors">
                  Back to Roster
                </Link>
              )}
              {/* Show 'Back to Dossier' ONLY on the log meeting page */}
              {activeTab === 'log-meeting' && selectedStudent && (
                <Link href={`?tab=student-profile&id=${selectedStudent.$id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 transition-colors">
                  Back to Dossier
                </Link>
              )}
              {(activeTab === 'student-academics' || activeTab === 'student-achievements') && selectedStudent && (
                <Link href={`?tab=student-profile&id=${selectedStudent.$id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 transition-colors">
                  Back to Dossier
                </Link>
              )}
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Workspace</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {pageTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {pageDesc}
              </p>
            </div>
            
            <div className="mt-1">
              <NotificationBell />
            </div>
          </div>

          {/* ================= TAB 1: MENTEE ROSTER ================= */}
          {activeTab === 'roster' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {(!myMentees || myMentees.length === 0) ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-slate-100" />
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No students assigned</h3>
                  <p className="text-slate-500 font-medium">The administration has not assigned any mentees to your roster yet.</p>
                </div>
              ) : (
                <MentorRosterExplorer mentees={myMentees} />
              )}
            </div>
          )}

          {/* ================= TAB 2: MEETINGS ================= */}
          {activeTab === 'meetings' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <MentorMeetingScheduler mentees={myMentees} />
              <MentorScheduledMeetings meetings={scheduledMeetings} />
            </div>
          )}

          {/* ================= TAB 2: GLOBAL NOTICES ================= */}
          {activeTab === 'notices' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800">Recent Broadcasts</h2>
                </div>
                <div className="p-6">
                  {(!notices || notices.length === 0) ? (
                    <p className="text-center text-slate-500 py-8">No notices have been published yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {notices.map((notice: any) => (
                        <div key={notice.$id} className="rounded-lg border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">N</span>
                            <h3 className="font-bold text-slate-800 text-lg">{notice.title}</h3>
                          </div>
                          <p className="text-slate-600 ml-11 mb-3">{notice.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: STUDENT PROFILE DOSSIER ================= */}
          {activeTab === 'student-profile' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
              
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                 <div className="flex items-center gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-xl font-bold text-blue-700 shadow-sm">
                      {selectedStudent.profilePictureId ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${selectedStudent.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                          alt={`${selectedStudent.fullName} Profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedStudent.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.fullName}</h2>
                      <p className="text-slate-500 font-medium">{selectedStudent.email}</p>
                      <div className="flex gap-2 mt-2">
                         <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200">
                           {selectedStudent.department || "N/A"}
                         </span>
                         <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold border border-green-200">
                           Verified Student
                         </span>
                      </div>
                    </div>
                 </div>
                 
                 <Link 
                    href={`?tab=log-meeting&id=${selectedStudent.$id}`}
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
                 >
                    Log New Meeting
                 </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <h3 className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-lg font-bold text-slate-800">
                      Academic Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Roll Number</p>
                         <p className="font-semibold text-slate-800">{selectedStudent.rollNo || "Not Provided"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Semester</p>
                         <p className="font-semibold text-slate-800">Semester {selectedStudent.semester || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current CGPA</p>
                         <p className="font-semibold text-slate-800 text-lg">{selectedStudent.cgpa || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Latest SPI</p>
                         <p className="font-semibold text-slate-800 text-lg">{latestAcademicRecord?.spi || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Latest CPI</p>
                         <p className="font-semibold text-slate-800 text-lg">{latestAcademicRecord?.cpi || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Backlogs</p>
                         <p className={`font-semibold text-lg ${Number(selectedStudent.backlogs) > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                           {selectedStudent.backlogs || "0"}
                         </p>
                       </div>
                       <div className="col-span-2">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Technical Interests</p>
                         <p className="font-semibold text-slate-800">{selectedStudent.interests || "None listed."}</p>
                       </div>
                       <div className="col-span-2">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Uploaded Academic Record</p>
                         <p className="font-semibold text-slate-800">
                           {latestAcademicRecord?.semester
                             ? `Semester ${latestAcademicRecord.semester} - SPI ${latestAcademicRecord.spi || "N/A"}, CPI ${latestAcademicRecord.cpi || "N/A"}`
                             : "No academic record uploaded yet."}
                         </p>
                       </div>
                    </div>
                    <div className="mt-6 flex gap-4 border-t border-slate-100 pt-4">
                       <Link 
                          href={`?tab=student-academics&id=${selectedStudent.$id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                       >
                          View Full Academic History →
                       </Link>
                       <Link 
                          href={`?tab=student-achievements&id=${selectedStudent.$id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                       >
                          View Achievements →
                       </Link>
                    </div>
                 </div>

                 <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-lg font-bold text-slate-800">
                      Logistics
                    </h3>
                    <div className="space-y-4">
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Group</p>
                         <div className="inline-flex items-center justify-center px-3 py-1 bg-red-50 text-red-700 font-bold rounded-lg border border-red-100">
                           {selectedStudent.bloodGroup || "Unknown"}
                         </div>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Housing Status</p>
                         <p className="font-semibold text-slate-800">{selectedStudent.residentialStatus || "Day Scholar"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Phone</p>
                         <p className="font-semibold text-slate-800">{selectedStudent.phone || "N/A"}</p>
                       </div>
                    </div>
                 </div>

                 <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
                    <h3 className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-lg font-bold text-slate-800">
                      Emergency & Guardian Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                          <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Father's Details</h4>
                          <div className="space-y-2">
                             <p className="text-sm"><span className="font-semibold text-slate-600">Name:</span> {selectedStudent.fatherName || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Phone:</span> {selectedStudent.fatherPhone || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Email:</span> {selectedStudent.fatherEmail || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Occupation:</span> {selectedStudent.fatherOccupation || "N/A"}</p>
                          </div>
                       </div>
                       <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                          <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Mother's Details</h4>
                          <div className="space-y-2">
                             <p className="text-sm"><span className="font-semibold text-slate-600">Name:</span> {selectedStudent.motherName || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Phone:</span> {selectedStudent.motherPhone || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Email:</span> {selectedStudent.motherEmail || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Occupation:</span> {selectedStudent.motherOccupation || "N/A"}</p>
                          </div>
                       </div>
                    </div>
                 </div>

              </div>
            </div>
          )}

          {/* ================= TAB 3.5: STUDENT ACADEMIC HISTORY ================= */}
          {activeTab === 'student-academics' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <AcademicsManager
                initialRecords={academicRecords}
                profileId={selectedStudent.$id}
                isMentor={true}
              />
            </div>
          )}

          {/* ================= TAB 3.6: STUDENT ACHIEVEMENTS ================= */}
          {activeTab === 'student-achievements' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <AchievementsManager
                initialRecords={achievementRecords}
                profileId={selectedStudent.$id}
                isMentor={true}
              />
            </div>
          )}

          {/* ================= TAB 4: LOG NEW MEETING ================= */}
          {activeTab === 'log-meeting' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl">
            
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 shadow-sm">
                    M
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">New Session Record</h3>
                    <p className="text-slate-500 text-sm font-medium">Student: {selectedStudent.fullName}</p>
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
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Meeting Date</label>
                    <input type="date" name="date" required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Discussion Topic</label>
                      <select name="topic" required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select a topic...</option>
                        <option value="Academic Guidance">Academic Guidance</option>
                        <option value="Project/Internship">Project & Internships</option>
                        <option value="Career Counseling">Career Counseling</option>
                        <option value="General Check-in">General Check-in</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Session Notes & Action Items</label>
                    <textarea 
                      name="description" 
                      required 
                      rows={5} 
                      placeholder="Discussed strategies for improving CGPA in the upcoming mid-semesters. Advised the student to focus on core algorithms..."
                      className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" className="rounded-lg bg-blue-600 px-8 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700">
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
