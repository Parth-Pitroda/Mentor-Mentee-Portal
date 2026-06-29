import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getDashboardOverview, getMeetings } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";
import { 
  Calendar, 
  GraduationCap, 
  Clock, 
  UserCircle, 
  AlertCircle,
  CheckCircle2,
  Video,
  FileText,
  ArrowUpRight,
  Activity
} from "lucide-react";

type MeetingRequest = {
  $id: string;
  date?: string;
  proposedDate?: string;
  proposedTime?: string;
  agenda?: string;
  description?: string;
};

type ScheduledMeeting = MeetingRequest & {
  topic?: string;
  mentorName?: string;
  scheduledTime?: string;
  meetingMode?: string;
  meetingLink?: string;
  status?: string;
};

function getMeetingDetails(meeting: ScheduledMeeting | null) {
  if (!meeting) {
    return { time: "", mode: "", link: "", agenda: "" };
  }

  const description = meeting.description || "";
  const lines = description.split("\n");
  const time = meeting.scheduledTime || meeting.proposedTime || lines.find((line) => line.startsWith("Time:"))?.replace("Time:", "").trim() || "";
  const mode = meeting.meetingMode || lines.find((line) => line.startsWith("Mode:"))?.replace("Mode:", "").trim() || "";
  const link = meeting.meetingLink || lines.find((line) => line.startsWith("Link:"))?.replace("Link:", "").trim() || "";
  const agendaIndex = lines.findIndex((line) => line.trim() === "Agenda:");
  
  let agenda = meeting.agenda || (agendaIndex >= 0 ? lines.slice(agendaIndex + 1).join("\n").trim() : description);

  // Clean agenda by removing markers
  const cpMarker = "---COMMON_POINTS---";
  const snMarker = "---STUDENT_NOTES---";
  if (agenda.includes(cpMarker)) {
    agenda = agenda.split(cpMarker)[0].trim();
  }
  if (agenda.includes(snMarker)) {
    agenda = agenda.split(snMarker)[0].trim();
  }

  if (agenda.includes("[Mentor Scheduled Meeting]")) {
    const cleanLines = agenda.split("\n").filter(line => {
      const trimmed = line.trim();
      return (
        trimmed !== "[Mentor Scheduled Meeting]" &&
        !trimmed.startsWith("Time:") &&
        !trimmed.startsWith("Mode:") &&
        !trimmed.startsWith("Venue:") &&
        !trimmed.startsWith("Link:") &&
        trimmed !== "Agenda:"
      );
    });
    agenda = cleanLines.join("\n").trim();
  }

  return { time, mode, link, agenda };
}

export default async function DashboardOverviewPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let profileData = null;
  let meetings: any[] = [];
  let pendingMeetingRequests: MeetingRequest[] = [];
  let pendingAcademicApprovals: unknown[] = [];
  let pendingAchievementApprovals: unknown[] = [];
  let activeMeetings: ScheduledMeeting[] = [];
  let academicData: any = null;
  let isMentor = false;
  let isOwnProfile = false;
  let mentorName = "Pending Assignment";
  let mentorEmail = "";
  let mentorDepartment = "";

  try {
    const [overview, fullMeetings] = await Promise.all([
      getDashboardOverview(profileId),
      getMeetings(profileId)
    ]);
    if (!overview) throw new Error("Dashboard overview unavailable.");

    profileData = overview.profile;
    meetings = fullMeetings || [];
    pendingMeetingRequests = overview.pendingMeetingRequests || [];
    pendingAcademicApprovals = overview.pendingAcademicApprovals || [];
    pendingAchievementApprovals = overview.pendingAchievementApprovals || [];
    const scheduledMeetings = (overview.activeMeetings || []) as ScheduledMeeting[];
    activeMeetings = scheduledMeetings
      .filter((meeting) => meeting.status !== "Verified" && meeting.status !== "Rejected")
      .sort((a, b) => {
        const aDetails = getMeetingDetails(a);
        const bDetails = getMeetingDetails(b);
        return `${a.date || ""} ${aDetails.time}`.localeCompare(`${b.date || ""} ${bDetails.time}`);
      });
    academicData = overview.academicData || null;
    isOwnProfile = profileData?.email?.toLowerCase() === user.email.toLowerCase();
    isMentor = overview.currentProfile?.role === "mentor";
    
    if (overview.mentor?.fullName) {
      mentorName = overview.mentor.fullName;
      mentorEmail = overview.mentor.email || "";
      mentorDepartment = overview.mentor.department || "";
    }
  } catch (error) {
    console.error("Dashboard overview data fetch failed:", error);
  }

  const displayDepartment = profileData?.department || "Pending Assignment";
  const studentName = profileData?.fullName || "Student";
  const currentSemester = academicData?.semester ? Number(academicData.semester) : 1;
  const totalPendingApprovals = pendingMeetingRequests.length + pendingAcademicApprovals.length + pendingAchievementApprovals.length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 selection:bg-slate-900 selection:text-white">
      
      {/* MAIN CONTENT */}
      {!profileData?.isVerified && !isMentor ? (
        <div className="max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/50 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
          <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-905">Verification Pending</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Your onboarding details are currently under review. Once the administration verifies your account, your assigned faculty mentor and full workspace tools will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
          
          {/* ================= CORE KPI GRID ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KPI 1: Academics GPA */}
            <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-md transition-all duration-350">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-450">Current GPA</p>
                </div>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                  {academicData?.semester ? `Sem ${academicData.semester}` : "No Data"}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {academicData?.cpi ? Number(academicData.cpi).toFixed(2) : "0.00"}
                  </span>
                  <span className="text-xs font-bold text-slate-405">CPI</span>
                </div>
                <p className="mt-2.5 text-xs font-semibold text-slate-505 flex items-center gap-1">
                  Latest verified term SPI: <strong className="text-slate-800 font-extrabold">{academicData?.spi ? Number(academicData.spi).toFixed(2) : "N/A"}</strong>
                </p>
              </div>
            </div>

            {/* KPI 2: Scheduled Sessions */}
            <div className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-md transition-all duration-350">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-450">Mentorship</p>
                </div>
                {activeMeetings.length > 0 ? (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md animate-pulse">
                    Active Session
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md">
                    Up to date
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {activeMeetings.length}
                  </span>
                  <span className="text-xs font-bold text-slate-450"> active session{activeMeetings.length === 1 ? "" : "s"}</span>
                </div>
                <p className="mt-2.5 text-xs font-semibold text-slate-500">
                  {activeMeetings.length > 0 ? "Upcoming meeting is scheduled" : "No active upcoming sessions"}
                </p>
              </div>
            </div>

            {/* KPI 3: Pending Approvals Notifier */}
            <div className={`group rounded-2xl border p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-md transition-all duration-350 ${
              totalPendingApprovals > 0 ? "border-amber-200 bg-amber-50/15" : "border-slate-200/60 bg-white"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    totalPendingApprovals > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-500"
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-450">Awaiting Verification</p>
                </div>
                {totalPendingApprovals > 0 && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">
                    Action Required
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {totalPendingApprovals}
                  </span>
                  <span className="text-xs font-bold text-slate-450"> pending approval{totalPendingApprovals === 1 ? "" : "s"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-550 shadow-sm">
                    Meetings: {pendingMeetingRequests.length}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-550 shadow-sm">
                    Academics: {pendingAcademicApprovals.length}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-550 shadow-sm">
                    Achievements: {pendingAchievementApprovals.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= MAIN SPLIT CONTENT GRID ================= */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            
            {/* LEFT COLUMN: ACTIVE WORKSPACE FEED */}
            <div className="space-y-8">
              
              {/* Academic Milestone Tracker */}
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-450">Academic Progress</h3>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">Semesters Completed</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                    Semester {currentSemester}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Degree Completion</span>
                    <span className="text-slate-900 font-extrabold">{Math.round(((currentSemester - 1) / 8) * 100)}%</span>
                  </div>
                  
                  {/* Premium Gradient Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${((currentSemester - 1) / 8) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>{currentSemester - 1} of 8 Completed</span>
                    <span>{8 - (currentSemester - 1)} Semesters Left</span>
                  </div>
                </div>
              </div>

              {/* Pending Meeting Request Notifier */}
              {!isMentor && pendingMeetingRequests.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Pending Meeting Requests</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendingMeetingRequests.map((request) => (
                      <div key={request.$id} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_auto] md:items-center hover:bg-slate-50/50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {request.proposedDate || request.date || "Date pending"}
                            {request.proposedTime ? ` at ${request.proposedTime}` : ""}
                          </p>
                          <p className="mt-1 text-sm text-slate-500 line-clamp-1">{request.agenda || request.description}</p>
                        </div>
                        <span className="w-fit rounded bg-amber-50 border border-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                          Requested
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General History Table */}
              <div className="pt-2">
                <MeetingTableWrapper initialMeetings={meetings} profileId={profileId} isMentor={isMentor} />
              </div>

            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <UserCircle className="w-5 h-5 text-slate-400" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-800">Assigned Mentor</p>
                </div>
                
                <div className="flex flex-col items-center text-center p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  {/* Beautiful Gradient Initials Avatar */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-xl font-black text-white shadow-md shadow-indigo-500/10 mb-4 border border-indigo-400/20">
                    {mentorName !== "Pending Assignment" ? mentorName.charAt(0).toUpperCase() : "?"}
                  </div>
                  
                  <div className="min-w-0 w-full">
                    <p className="font-extrabold tracking-tight text-slate-900 text-base">{mentorName}</p>
                    {mentorEmail ? (
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{mentorEmail}</p>
                    ) : null}
                    {mentorDepartment ? (
                      <p className="mt-3 inline-flex text-[10px] font-bold bg-white text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">{mentorDepartment}</p>
                    ) : null}
                    
                    {!profileData?.mentorId && (
                      <p className="mt-3 text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                        Awaiting faculty assignment.
                      </p>
                    )}
                  </div>
                </div>

                {profileData?.mentorId && (
                  <div className="mt-5">
                    <a 
                      href="/booking"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      Book Meeting Slot
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
              
              {/* Academic Deadlines */}
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
                <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-4">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-800">Academic Deadlines</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Upload Current Semester Marksheet</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">Verify results before the end of term review.</p>
                      <span className="inline-flex mt-2 text-[9px] font-black uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100/50">
                        Due in 5 days
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start border-t border-slate-100 pt-4">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Mid-Sem Mentor Feedback Survey</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">Submit the feedback questionnaire for meeting review.</p>
                      <span className="inline-flex mt-2 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50">
                        Due next week
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </aside>

          </div>
          
        </div>
      )}
    </div>
  );
}