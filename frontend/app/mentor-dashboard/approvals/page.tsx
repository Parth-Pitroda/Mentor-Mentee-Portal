import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { 
  getPendingApprovals, 
  respondToMeetingRequest,
  updateMeetingStatus, 
  updateAcademicStatus, 
  updateAchievementStatus
} from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import MentorSidebar from "@/components/MentorSidebar";
import { getFileViewUrl } from "@/lib/files";
import type { AcademicUploadRecord, AchievementRecord, Meeting } from "@/types";
import { Award, BookOpen, CalendarClock, Check, Eye, Inbox, X } from "lucide-react";

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

function getInitials(name?: string) {
  return (name || "Student")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatApprovalDate(date?: string) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mx-auto my-8 max-w-xl rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
      <Inbox className="mx-auto mb-4 h-12 w-12 text-slate-300" />
      <h3 className="text-base font-bold text-slate-850">{message}</h3>
    </div>
  );
}

function QueueHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
      <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">{title}</h3>
    </div>
  );
}

function ViewButton({ href, external = false }: { href: string; external?: boolean }) {
  const className = "flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <Eye className="h-3.5 w-3.5" />
        View
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <Eye className="h-3.5 w-3.5" />
      View
    </Link>
  );
}

function AcceptButton({ children = "Accept" }: { children?: string }) {
  return (
    <button
      type="submit"
      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
    >
      <Check className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function RejectButton() {
  return (
    <button
      type="submit"
      className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition-all hover:scale-[1.02] hover:bg-rose-100/50 active:scale-[0.98]"
    >
      <X className="h-3.5 w-3.5" />
      Reject
    </button>
  );
}

// 1. Next.js 15 passes searchParams as a Promise to read URL queries!
export default async function MentorApprovalsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "requests"; // Defaults to requests to match the mentor approvals queue.

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "M";

  const pendingData = await getPendingApprovals(user.$id);
  const { meetings, meetingRequests, academics, achievements } = pendingData;
  const pendingApprovalCount = meetings.length + meetingRequests.length + academics.length + achievements.length;

  const getFileUrl = (fileId: string) => {
    return getFileViewUrl(fileId);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-slate-200 selection:text-slate-900">
      <MentorSidebar activeItem="approvals" pendingApprovalCount={pendingApprovalCount} userName={user.name} />

      {/* MAIN CONTENT AREA */}
      <main className="min-h-screen p-6 lg:p-10 md:ml-64">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Pending Approvals</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div 
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm border border-slate-200 select-none"
                title={user.name || "Faculty Member"}
              >
                {initials}
              </div>
            </div>
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
              {meetingRequests.length === 0 ? <EmptyState message="No meeting requests awaiting confirmation." /> : (
                <>
                  <QueueHeader title="Pending Meeting Requests Queue" />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {meetingRequests.map((request: ApprovalRecord) => (
                      <div key={request.$id} className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-xs font-black text-white shadow-sm">
                                {getInitials(request.studentName)}
                              </span>
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900">{request.studentName || "A mentee"}</h4>
                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Proposed Slot</p>
                              </div>
                            </div>
                            <span className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                              {formatApprovalDate(request.proposedDate || request.date)}
                              {request.proposedTime ? ` @ ${request.proposedTime}` : ""}
                            </span>
                          </div>

                          <div className="space-y-1 rounded-xl border border-slate-100/85 bg-slate-50 p-4">
                            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Agenda & Notes</span>
                            <p className="text-xs font-semibold leading-relaxed text-slate-600">
                              {request.agenda || request.description || "No agenda specified."}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                          <ViewButton href={`/mentor-dashboard/student/${request.studentId}`} />
                          <form action={async () => { "use server"; await respondToMeetingRequest(request.$id, "Confirmed"); }}>
                            <AcceptButton />
                          </form>
                          <form action={async () => { "use server"; await respondToMeetingRequest(request.$id, "Rejected"); }}>
                            <RejectButton />
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ACADEMICS TAB */}
          {activeTab === 'academics' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {academics.length === 0 ? <EmptyState message="No pending academic records to review." /> : (
                <>
                  <QueueHeader title="Pending Academic Approvals Queue" />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {(academics as AcademicApprovalRecord[]).map((acad) => (
                      <div key={acad.$id} className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-xs font-black text-white shadow-sm">
                                {getInitials(acad.studentName)}
                              </span>
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900">{acad.studentName || "A mentee"}</h4>
                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Record</p>
                              </div>
                            </div>
                            <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                              {String(acad.semester).toLowerCase().includes("semester") ? acad.semester : `Semester ${acad.semester}`}
                            </span>
                          </div>

                          <div className="space-y-3 rounded-xl border border-slate-100/85 bg-slate-50 p-4">
                            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                              <BookOpen className="h-3 w-3" />
                              Scores & Proof
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-100">CPI: <span className="text-blue-600">{acad.cpi ?? "N/A"}</span></span>
                              <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-100">SPI: <span className="text-blue-600">{acad.spi ?? "N/A"}</span></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                          <ViewButton href={acad.fileId ? getFileUrl(acad.fileId) : `/mentor-dashboard/student/${acad.studentId}`} external={Boolean(acad.fileId)} />
                          <form action={async () => { "use server"; await updateAcademicStatus(acad.$id, "Verified", acad.studentId); }}>
                            <AcceptButton />
                          </form>
                          <form action={async () => { "use server"; await updateAcademicStatus(acad.$id, "Rejected", acad.studentId); }}>
                            <RejectButton />
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {achievements.length === 0 ? <EmptyState message="No pending extracurricular achievements to review." /> : (
                <>
                  <QueueHeader title="Pending Achievement Approvals Queue" />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {(achievements as AchievementApprovalRecord[]).map((ach) => (
                      <div key={ach.$id} className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-xs font-black text-white shadow-sm">
                                {getInitials(ach.studentName)}
                              </span>
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900">{ach.studentName || "A mentee"}</h4>
                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Achievement Proof</p>
                              </div>
                            </div>
                            <span className="rounded-lg border border-purple-100 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">
                              {ach.category}
                            </span>
                          </div>

                          <div className="space-y-1 rounded-xl border border-slate-100/85 bg-slate-50 p-4">
                            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                              <Award className="h-3 w-3" />
                              {ach.title}
                            </span>
                            <p className="text-xs font-semibold leading-relaxed text-slate-600">{ach.description || "No description submitted."}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                          <ViewButton href={ach.fileId ? getFileUrl(ach.fileId) : `/mentor-dashboard/student/${ach.studentId}`} external={Boolean(ach.fileId)} />
                          <form action={async () => { "use server"; await updateAchievementStatus(ach.$id, "Verified", ach.studentId); }}>
                            <AcceptButton />
                          </form>
                          <form action={async () => { "use server"; await updateAchievementStatus(ach.$id, "Rejected", ach.studentId); }}>
                            <RejectButton />
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* MEETINGS TAB */}
          {activeTab === 'meetings' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {meetings.length === 0 ? <EmptyState message="No pending meeting logs to review." /> : (
                <>
                  <QueueHeader title="Pending Meeting Logs Queue" />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {(meetings as MeetingApprovalRecord[]).map((meeting) => (
                      <div key={meeting.$id} className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-xs font-black text-white shadow-sm">
                                {getInitials(meeting.studentName)}
                              </span>
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900">{meeting.studentName || "A mentee"}</h4>
                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Meeting Log</p>
                              </div>
                            </div>
                            <span className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                              {formatApprovalDate(meeting.date)}
                            </span>
                          </div>

                          <div className="space-y-1 rounded-xl border border-slate-100/85 bg-slate-50 p-4">
                            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                              <CalendarClock className="h-3 w-3" />
                              {meeting.topic || "Meeting Notes"}
                            </span>
                            <p className="text-xs font-semibold leading-relaxed text-slate-600">{meeting.description || "No meeting description submitted."}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                          <ViewButton href={`/mentor-dashboard/student/${meeting.studentId}`} />
                          <form action={async () => { "use server"; await updateMeetingStatus(meeting.$id, "Verified", meeting.studentId); }}>
                            <AcceptButton />
                          </form>
                          <form action={async () => { "use server"; await updateMeetingStatus(meeting.$id, "Rejected", meeting.studentId); }}>
                            <RejectButton />
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
