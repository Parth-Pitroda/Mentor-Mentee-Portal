import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { 
  getStudentProfile, 
  getMentorScheduledMeetings, 
  getLatestAcademicRecord, 
  getAchievementRecordsForProfile,
  getMentorNote
} from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getFileViewUrl } from "@/lib/files";
import MentorNotesEditor from "@/components/MentorNotesEditor";
import { 
  Users, 
  CheckSquare, 
  CalendarDays, 
  Bell, 
  LayoutDashboard 
} from "lucide-react";

export default async function MentorStudentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const studentId = params.id;

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // 1. Fetch the data in parallel
  const [studentData, scheduledMeetings, latestAcademicRecord, achievementRecords, mentorNote] = await Promise.all([
    getStudentProfile(studentId),
    getMentorScheduledMeetings(user.$id),
    getLatestAcademicRecord(studentId),
    getAchievementRecordsForProfile(studentId),
    getMentorNote(studentId)
  ]);

  if (!studentData || !studentData.profile) return <div className="p-12 text-center text-slate-500 font-bold">Student not found.</div>;

  // 2. Extract profile object and notes variables
  const student = studentData.profile;
  const initialNoteContent = mentorNote?.content || "";
  const initialCollectionMissing = !!mentorNote?.collectionMissing;

  const getInitials = (name?: string) => {
    if (!name) return "S";
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const studentMeetings = (scheduledMeetings || []).filter((m: any) => m.studentId === student.$id || m.studentName === student.fullName);
  const totalMeetingsCount = studentMeetings.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-poppins selection:bg-blue-100 selection:text-blue-900 flex">
      
      {/* ================= FULL-HEIGHT SIDEBAR ================= */}
      <aside className="fixed top-0 left-0 z-20 hidden h-screen w-64 flex-col bg-[#1A1A24] text-white md:flex animate-in fade-in duration-300">
        {/* BRANDING LOGO */}
        <div className="flex h-24 shrink-0 items-center justify-center border-b border-white/5 px-6">
          <img src="/pdeu_logo.png" alt="PDEU Logo" className="h-14 w-auto object-contain" />
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-6 pl-4 pr-0 space-y-1.5">
          <Link 
            href="/mentor-dashboard?tab=dashboard" 
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
          >
            <span>Dashboard</span>
          </Link>

          <Link 
            href="/mentor-dashboard?tab=roster" 
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-bold bg-[#F8FAFC] text-slate-900 rounded-l-full rounded-r-none pl-6 pr-6 relative z-10 mr-0"
          >
            <span>My Mentees</span>
            {/* Top curve */}
            <div className="absolute right-0 -top-4 w-4 h-4 bg-[#F8FAFC] pointer-events-none">
              <div className="w-full h-full rounded-br-full bg-[#1A1A24]" />
            </div>
            {/* Bottom curve */}
            <div className="absolute right-0 -bottom-4 w-4 h-4 bg-[#F8FAFC] pointer-events-none">
              <div className="w-full h-full rounded-tr-full bg-[#1A1A24]" />
            </div>
          </Link>

          <Link 
            href="/mentor-dashboard?tab=meetings" 
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
          >
            <span>Meetings</span>
          </Link>

          <Link 
            href="/mentor-dashboard/approvals" 
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
          >
            <span>Pending Approvals</span>
          </Link>

          <Link 
            href="/mentor-dashboard?tab=notices" 
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
          >
            <span>Global Notices</span>
          </Link>
        </nav>
        
        {/* USER PROFILE & LOGOUT */}
        <div className="p-4 border-t border-white/5 bg-transparent">
           <LogoutButton variant="sidebar-dark" />
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="md:ml-64 min-h-screen flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        
        {/* ================= TOP NAVIGATION BAR ================= */}
        <header className="h-24 shrink-0 bg-transparent px-6 lg:px-10 flex items-center justify-between select-none">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Profile</h1>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full border border-slate-200 text-slate-650 flex items-center justify-center font-bold text-sm bg-white shadow-sm cursor-default select-none animate-in fade-in duration-300">
              {user.name ? user.name.charAt(0).toUpperCase() : "M"}
            </div>
          </div>
        </header>

        {/* ================= MAIN DOSSIER CONTAINER ================= */}
        <main className="flex-1 p-6 lg:p-10 space-y-8 animate-in fade-in duration-300 select-none">

          {/* --- MAIN GRID SECTION --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
            
            {/* --- LEFT SECTION: GENERAL TEXT DETAILS --- */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 mb-5 border-b border-slate-300 pb-2">Profile Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1.5">
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Course</span>
                    <span className="text-slate-900 font-extrabold">{student.department || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Full Name</span>
                    <span className="text-slate-900 font-extrabold">{student.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Roll Number</span>
                    <span className="text-slate-900 font-extrabold">{student.rollNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Semester</span>
                    <span className="text-slate-900 font-extrabold">Semester {student.semester || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Father&apos;s Name</span>
                    <span className="text-slate-900 font-extrabold">{student.fatherName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Mother&apos;s Name</span>
                    <span className="text-slate-900 font-extrabold">{student.motherName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Email Address</span>
                    <span className="text-slate-900 font-extrabold">{student.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Phone Number</span>
                    <span className="text-slate-900 font-extrabold">{student.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Residential Status</span>
                    <span className="text-slate-900 font-extrabold">{student.residentialStatus || "Day Scholar"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Blood Group</span>
                    <span className="text-slate-900 font-extrabold">{student.bloodGroup || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Father&apos;s Phone</span>
                    <span className="text-slate-900 font-extrabold">{student.fatherPhone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Mother&apos;s Phone</span>
                    <span className="text-slate-900 font-extrabold">{student.motherPhone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm sm:col-span-2">
                    <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Technical Interests</span>
                    <span className="text-slate-900 font-extrabold text-right max-w-[75%] truncate">{student.interests || "No interests specified."}</span>
                  </div>
                </div>
              </div>

              {/* Private Notes Section */}
              <div className="mt-8">
                <MentorNotesEditor 
                  studentId={student.$id}
                  initialContent={initialNoteContent}
                  initialCollectionMissing={initialCollectionMissing}
                />
              </div>
            </div>

            {/* --- RIGHT SECTION: BIG IMAGE, DETAILS & ACTION (Borderless) --- */}
            <div className="md:col-span-1 space-y-4 md:border-l md:border-slate-100 md:pl-10">
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                {student.profilePictureId ? (
                  <img 
                    src={getFileViewUrl(student.profilePictureId)}
                    alt={`${student.fullName} Profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white text-5xl font-black">
                    {getInitials(student.fullName)}
                  </div>
                )}
              </div>

              {/* Student Details under the photo */}
              <div className="space-y-1.5 pt-2 select-none">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{student.fullName}</h2>
                <div className="flex flex-col gap-1 text-slate-555 text-xs font-semibold">
                  <p>Student ID : <b className="text-slate-800 font-bold">{student.rollNo || "N/A"}</b></p>
                  <p>Department : <b className="text-slate-800 font-bold">{student.department || "N/A"}</b></p>
                  <div className="pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold uppercase text-[9px] tracking-wider border ${
                      student.isVerified 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                      {student.isVerified ? (
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
              {!student.isVerified && (
                <form action={async () => {
                  "use server";
                  const { toggleStudentVerification } = await import("@/lib/actions/student.actions");
                  await toggleStudentVerification(student.$id, student.isVerified);
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
                  <p>Current CGPA : <span className="text-slate-900 font-extrabold">{student.cgpa || "N/A"}</span></p>
                  <p>Latest SPI : <span className="text-slate-900 font-extrabold">{latestAcademicRecord?.spi || "N/A"}</span></p>
                  <p className={Number(student.backlogs) > 0 ? "text-rose-500 font-extrabold" : "text-emerald-650"}>
                    Backlogs : {student.backlogs || 0}
                  </p>
                </div>
              </div>
              <Link 
                href={`/mentor-dashboard?tab=student-academics&id=${student.$id}`} 
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
                href={`/mentor-dashboard?tab=student-achievements&id=${student.$id}`} 
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
                href={`/mentor-dashboard?tab=log-meeting&id=${student.$id}`} 
                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-750 transition-all flex items-center gap-1 group/link"
              >
                Log mentorship session <span className="transform translate-x-0 group-hover/link:translate-x-1 transition-transform duration-200">&rarr;</span>
              </Link>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}