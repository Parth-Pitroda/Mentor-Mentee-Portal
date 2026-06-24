import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { 
  getPendingApprovals, 
  updateMeetingStatus, 
  updateAcademicStatus, 
  updateAchievementStatus,
  respondToMeetingRequest
} from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import MeetingActionButtons from "@/components/MeetingActionButtons";
import NotificationBell from "@/components/NotificationBell";
import { getFileViewUrl } from "@/lib/files";
import type { AcademicUploadRecord, AchievementRecord, Meeting } from "@/types";
import { 
  Users, 
  CalendarDays, 
  CheckSquare, 
  Bell, 
  LayoutDashboard 
} from "lucide-react";

type ApprovalRecord = {
  $id: string;
  studentId: string;
  studentName?: string;
  date?: string;
  proposedDate?: string;
  proposedTime?: string;
  agenda?: string;
  description?: string;
};

type MeetingApprovalRecord = Meeting & {
  $id: string;
  studentId: string;
  studentName?: string;
  topic?: string;
};

type AcademicApprovalRecord = AcademicUploadRecord & {
  studentId: string;
};

type AchievementApprovalRecord = AchievementRecord & {
  studentId: string;
};

// 1. Next.js 15 passes searchParams as a Promise to read URL queries!
export default async function MentorApprovalsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "academics"; // Defaults to academics if no tab is clicked

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const pendingData = await getPendingApprovals(user.$id);
  const { meetings, meetingRequests, academics, achievements } = pendingData;
  const pendingApprovalCount = meetings.length + meetingRequests.length + academics.length + achievements.length;

  const getFileUrl = (fileId: string) => {
    return getFileViewUrl(fileId);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-slate-200 selection:text-slate-900">
      
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
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
          >
            <span>My Mentees</span>
          </Link>

          <Link 
            href="/mentor-dashboard?tab=meetings" 
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
          >
            <span>Meetings</span>
          </Link>

          <Link 
            href="/mentor-dashboard/approvals" 
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-bold bg-[#F8FAFC] text-slate-900 rounded-l-full rounded-r-none pl-6 pr-6 relative z-10 mr-0"
          >
            <span>Pending Approvals</span>
            {pendingApprovalCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-900 text-white px-1.5 text-[10px] font-bold shadow-sm mr-2">
                {pendingApprovalCount}
              </span>
            )}
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
            href="/mentor-dashboard?tab=notices" 
            className="group flex items-center justify-between py-3 transition-all duration-200 text-lg font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-4 px-4"
          >
            <span>Global Notices</span>
          </Link>
        </nav>
        
        {/* USER PROFILE & LOGOUT */}
        <div className="p-4 border-t border-white/5 bg-transparent">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-white">{user.name || "Faculty Member"}</span>
                <span className="truncate text-xs text-slate-400 font-medium">Mentor Account</span>
              </div>
           </div>
           <div className="px-1"><LogoutButton variant="sidebar-dark" /></div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="min-h-screen p-6 lg:p-10 md:ml-64">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Pending Approvals</h1>
            </div>
            <NotificationBell />
          </div>

          <div className="mb-8 flex w-full flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1.5 shadow-sm lg:w-fit">
            <Link 
              href="?tab=requests" 
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Meeting Requests
              <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === 'requests' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                {meetingRequests.length}
              </span>
            </Link>

            <Link 
              href="?tab=academics" 
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'academics' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Academics
              <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === 'academics' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                {academics.length}
              </span>
            </Link>
            
            <Link 
              href="?tab=achievements" 
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'achievements' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Achievements
              <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === 'achievements' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
                {achievements.length}
              </span>
            </Link>

            <Link 
              href="?tab=meetings" 
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === 'meetings' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Meeting Logs
              <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === 'meetings' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-500'}`}>
                {meetings.length}
              </span>
            </Link>
          </div>

          {/* ================= TAB CONTENT RENDERER ================= */}

          {/* MEETING REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {meetingRequests.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">No meeting requests awaiting confirmation.</p> : meetingRequests.map((request: ApprovalRecord) => (
                <div key={request.$id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Meeting Request</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Student: <span className="font-bold text-slate-700">{request.studentName}</span>
                      {" "} | Date: {request.proposedDate || request.date ? new Date(request.proposedDate || request.date || "").toLocaleDateString() : "N/A"}
                      {request.proposedTime ? ` | Time: ${request.proposedTime}` : ""}
                    </p>
                    <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                      {request.agenda || request.description}
                    </p>
                  </div>
                  <MeetingActionButtons meetingId={request.$id} />
                </div>
              ))}
            </div>
          )}
          
          {/* ACADEMICS TAB */}
          {activeTab === 'academics' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {academics.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">No pending academic records to review.</p> : (academics as AcademicApprovalRecord[]).map((acad) => (
                <div key={acad.$id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {String(acad.semester).toLowerCase().includes('semester') ? acad.semester : `Semester ${acad.semester}`}
                    </h3>
                    <p className="text-sm text-slate-500">Student: <span className="font-bold text-slate-700">{acad.studentName}</span></p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm font-medium bg-slate-100 px-2.5 py-1 rounded-md">CPI: <span className="text-blue-600 font-bold">{acad.cpi}</span></span>
                      <span className="text-sm font-medium bg-slate-100 px-2.5 py-1 rounded-md">SPI: <span className="text-blue-600 font-bold">{acad.spi}</span></span>
                    </div>
                    {acad.fileId && (
                      <a href={getFileUrl(acad.fileId)} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-bold mt-3 flex items-center gap-1 hover:underline w-fit">
                        📄 View Attached Marksheet
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 min-w-max">
                    <form action={async () => { "use server"; await updateAcademicStatus(acad.$id, "Verified", acad.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all">Verify</button>
                    </form>
                    <form action={async () => { "use server"; await updateAcademicStatus(acad.$id, "Rejected", acad.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition-all">Reject</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {achievements.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">No pending extracurricular achievements to review.</p> : (achievements as AchievementApprovalRecord[]).map((ach) => (
                <div key={ach.$id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{ach.title} <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md ml-2">{ach.category}</span></h3>
                    <p className="text-sm text-slate-500 mt-1">Student: <span className="font-bold text-slate-700">{ach.studentName}</span></p>
                    <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">{ach.description}</p>
                    {ach.fileId && (
                      <a href={getFileUrl(ach.fileId)} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-bold mt-3 flex items-center gap-1 hover:underline w-fit">
                        🏆 View Certificate/Proof
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 min-w-max items-start">
                    <form action={async () => { "use server"; await updateAchievementStatus(ach.$id, "Verified", ach.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all">Verify</button>
                    </form>
                    <form action={async () => { "use server"; await updateAchievementStatus(ach.$id, "Rejected", ach.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition-all">Reject</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MEETINGS TAB */}
          {activeTab === 'meetings' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {meetings.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">No pending meeting logs to review.</p> : (meetings as MeetingApprovalRecord[]).map((meeting) => (
                <div key={meeting.$id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{meeting.topic}</h3>
                    <p className="text-sm text-slate-500 mt-1">Student: <span className="font-bold text-slate-700">{meeting.studentName}</span> | Date: {new Date(meeting.date).toLocaleDateString()}</p>
                    <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">{meeting.description}</p>
                  </div>
                  <div className="flex gap-2 min-w-max">
                    <form action={async () => { "use server"; await updateMeetingStatus(meeting.$id, "Verified", meeting.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all">Verify</button>
                    </form>
                    <form action={async () => { "use server"; await updateMeetingStatus(meeting.$id, "Rejected", meeting.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition-all">Reject</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
