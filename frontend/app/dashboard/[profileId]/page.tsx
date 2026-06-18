import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getDashboardOverview } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";
import MeetingRequestForm from "@/components/MeetingRequestForm";
import { 
  Calendar, 
  GraduationCap, 
  Clock, 
  UserCircle, 
  AlertCircle,
  CheckCircle2,
  Video,
  FileText
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
  const agenda = meeting.agenda || (agendaIndex >= 0 ? lines.slice(agendaIndex + 1).join("\n").trim() : description);

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
    const overview = await getDashboardOverview(profileId);
    if (!overview) throw new Error("Dashboard overview unavailable.");

    profileData = overview.profile;
    meetings = overview.meetings || [];
    pendingMeetingRequests = overview.pendingMeetingRequests || [];
    pendingAcademicApprovals = overview.pendingAcademicApprovals || [];
    pendingAchievementApprovals = overview.pendingAchievementApprovals || [];
    const scheduledMeetings = (overview.activeMeetings || []) as ScheduledMeeting[];
    activeMeetings = scheduledMeetings
      .filter((meeting) => meeting.status !== "Verified" && meeting.status !== "Rejected")
      .sort((a, b) => {
        const aDetails = getMeetingDetails(a);
        const bDetails = getMeetingDetails(b);
        return `${b.date || ""} ${bDetails.time}`.localeCompare(`${a.date || ""} ${aDetails.time}`);
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
  const totalPendingApprovals = pendingMeetingRequests.length + pendingAcademicApprovals.length + pendingAchievementApprovals.length;

  return (
    <div className="mx-auto max-w-6xl">
      
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Welcome, {studentName}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Pandit Deendayal Energy University / {displayDepartment}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide bg-white shadow-sm">
          {profileData?.isVerified ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-700">Verified Profile</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-slate-700">Verification Pending</span>
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      {!profileData?.isVerified && !isMentor ? (
        <div className="max-w-2xl rounded-xl border border-amber-200 bg-amber-50/50 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
          <div className="mb-5 h-1.5 w-16 rounded-full bg-amber-400" />
          <h3 className="text-lg font-semibold text-slate-900">Verification Pending</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Your onboarding details are currently under review. Once the administration verifies your account, your assigned faculty mentor and full workspace tools will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "100ms" }}>
          
          {/* LEFT COLUMN: ACTIVE DASHBOARD DATA */}
          <div className="space-y-8">
            
            {/* Active Meetings Card */}
            <div className={`rounded-xl border shadow-sm p-6 sm:p-8 ${
              activeMeetings.length > 0 ? "border-slate-200 bg-slate-900 text-white" : "border-slate-200 bg-white"
            }`}>
              {activeMeetings.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <p className="text-sm font-semibold tracking-wide text-blue-100">Next Scheduled Session</p>
                  </div>
                  <div className="space-y-4">
                    {activeMeetings.map((meeting) => {
                      const details = getMeetingDetails(meeting);
                      return (
                        <div key={meeting.$id} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <h3 className="text-2xl font-semibold tracking-tight text-white">{meeting.topic || "Mentorship Session"}</h3>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-300">
                                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">
                                  <Clock className="w-4 h-4" /> {meeting.date || "Date pending"} {details.time ? `• ${details.time}` : ""}
                                </span>
                                {details.mode && (
                                  <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md">
                                    <Video className="w-4 h-4" /> {details.mode}
                                  </span>
                                )}
                              </div>
                              <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                                <span className="text-slate-300 font-semibold">Agenda: </span>
                                {details.agenda || "No agenda provided yet."}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col gap-3">
                              <span className="w-fit rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                                {meeting.status === "Pending" ? "Personal" : meeting.status || "Scheduled"}
                              </span>
                              {details.link && (
                                <a
                                  href={details.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-fit rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                >
                                  Join Meeting
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <p className="text-sm font-semibold tracking-wide text-slate-900">Scheduled Meetings</p>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">No upcoming sessions</h3>
                  <p className="mt-1.5 text-sm font-medium text-slate-500">Your mentor has not scheduled any active meetings at this time.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              
              {/* Academics Overview Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <GraduationCap className="w-5 h-5 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-900">Current Academics</p>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-semibold tracking-tight text-slate-900 mb-4">
                    {academicData?.semester ? `Semester ${academicData.semester}` : "No Data"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-700">CPI: {academicData?.cpi || "N/A"}</span>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-700">SPI: {academicData?.spi || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Pending Approvals Tracker */}
              {!isMentor && (
                <div className={`rounded-xl border p-6 shadow-sm ${
                  totalPendingApprovals > 0 ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"
                }`}>
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className={`w-5 h-5 ${totalPendingApprovals > 0 ? "text-amber-500" : "text-slate-400"}`} />
                    <p className="text-sm font-semibold text-slate-900">Awaiting Approval</p>
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900 mb-4">
                    {totalPendingApprovals} pending item{totalPendingApprovals === 1 ? "" : "s"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                      Meetings: {pendingMeetingRequests.length}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                      Academics: {pendingAcademicApprovals.length}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                      Achievements: {pendingAchievementApprovals.length}
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Pending Requests List */}
            {!isMentor && pendingMeetingRequests.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Pending Meeting Requests</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {pendingMeetingRequests.map((request) => (
                    <div key={request.$id} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_auto] md:items-center hover:bg-slate-50/50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {request.proposedDate || request.date || "Date pending"}
                          {request.proposedTime ? ` at ${request.proposedTime}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 line-clamp-1">{request.agenda || request.description}</p>
                      </div>
                      <span className="w-fit rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Requested
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General History Table */}
            <div className="pt-4">
              <MeetingTableWrapper initialMeetings={meetings} profileId={profileId} isMentor={isMentor} />
            </div>

          </div>

          {/* RIGHT COLUMN: MENTOR SIDEBAR */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sticky top-8">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <UserCircle className="w-5 h-5 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">Assigned Mentor</p>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-400 border border-slate-200">
                  {mentorName !== "Pending Assignment" ? mentorName.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold tracking-tight text-slate-900 text-lg">{mentorName}</p>
                  {mentorEmail && <p className="mt-0.5 truncate text-sm text-slate-500">{mentorEmail}</p>}
                  {mentorDepartment && <p className="mt-1.5 inline-flex text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{mentorDepartment}</p>}
                  {!profileData?.mentorId && (
                    <p className="mt-2 text-sm text-amber-600 font-medium">Awaiting faculty assignment.</p>
                  )}
                </div>
              </div>
              
              {!isMentor && isOwnProfile && profileData?.mentorId && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <MeetingRequestForm profileId={profileId} />
                </div>
              )}
            </div>
          </aside>

        </div>
      )}
    </div>
  );
}