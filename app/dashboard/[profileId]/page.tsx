import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { Client, Databases, Query } from "node-appwrite";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";
import MeetingRequestForm from "@/components/MeetingRequestForm";

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
  let meetings = [];
  let pendingMeetingRequests: MeetingRequest[] = [];
  let pendingAcademicApprovals: unknown[] = [];
  let pendingAchievementApprovals: unknown[] = [];
  let activeMeetings: ScheduledMeeting[] = [];
  let academicData = null;
  let isMentor = false;
  let isOwnProfile = false;
  let mentorName = "Pending Assignment";
  let mentorEmail = "";
  let mentorDepartment = "";

  try {
    // 1. Securely initialize the Server Client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(client);

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
    const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;
    const ACADEMICS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!; 
    const ACHIEVEMENTS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!;

    // 2. Role Check for the Logged-in User
    const currentUserProfile = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION, [
      Query.equal("email", [user.email.toLowerCase()])
    ]);
    
    if (currentUserProfile.total > 0 && currentUserProfile.documents[0].role === "mentor") {
      isMentor = true;
    }

    // 3. Fetch Student Profile, Recent Meetings, and Most Recent Academic Record
    const [profileRes, meetingsRes, requestRes, pendingAcademicsRes, pendingAchievementsRes, scheduledRes, academicsRes] = await Promise.all([
      databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileId).catch(() => null),
      databases.listDocuments(DATABASE_ID, MEETINGS_COLLECTION, [
        Query.equal("studentId", profileId),
        Query.orderDesc("$createdAt"),
        Query.limit(3)
      ]).catch(() => ({ documents: [] })),
      databases.listDocuments(DATABASE_ID, MEETINGS_COLLECTION, [
        Query.equal("studentId", profileId),
        Query.equal("status", ["Requested"]),
        Query.orderDesc("$createdAt"),
        Query.limit(5)
      ]).catch(() => ({ documents: [] })),
      databases.listDocuments(DATABASE_ID, ACADEMICS_COLLECTION, [
        Query.equal("studentId", profileId),
        Query.equal("status", ["Pending"]),
        Query.orderDesc("$createdAt"),
        Query.limit(25)
      ]).catch(() => ({ documents: [] })),
      databases.listDocuments(DATABASE_ID, ACHIEVEMENTS_COLLECTION, [
        Query.equal("studentId", profileId),
        Query.equal("status", ["Pending"]),
        Query.orderDesc("$createdAt"),
        Query.limit(25)
      ]).catch(() => ({ documents: [] })),
      databases.listDocuments(DATABASE_ID, MEETINGS_COLLECTION, [
        Query.equal("studentId", profileId),
        Query.equal("status", ["Scheduled", "Pending"]),
        Query.orderDesc("date"),
        Query.limit(25)
      ]).catch(() => ({ documents: [] })),
      databases.listDocuments(DATABASE_ID, ACADEMICS_COLLECTION, [
        Query.equal("studentId", profileId),
        Query.orderDesc("$createdAt"),
        Query.limit(1) 
      ]).catch(() => ({ documents: [] }))
    ]);

    profileData = profileRes ? JSON.parse(JSON.stringify(profileRes)) : null;
    meetings = JSON.parse(JSON.stringify(meetingsRes.documents));
    pendingMeetingRequests = JSON.parse(JSON.stringify(requestRes.documents));
    pendingAcademicApprovals = JSON.parse(JSON.stringify(pendingAcademicsRes.documents));
    pendingAchievementApprovals = JSON.parse(JSON.stringify(pendingAchievementsRes.documents));
    const scheduledMeetings = JSON.parse(JSON.stringify(scheduledRes.documents)) as ScheduledMeeting[];
    activeMeetings = scheduledMeetings
      .filter((meeting) => meeting.status !== "Verified" && meeting.status !== "Rejected")
      .sort((a, b) => {
        const aDetails = getMeetingDetails(a);
        const bDetails = getMeetingDetails(b);
        return `${b.date || ""} ${bDetails.time}`.localeCompare(`${a.date || ""} ${aDetails.time}`);
      });
    academicData = academicsRes.documents.length > 0 ? JSON.parse(JSON.stringify(academicsRes.documents[0])) : null;
    isOwnProfile = profileData?.email?.toLowerCase() === user.email.toLowerCase();
    
    // 4. Resolve the Primary Mentor's Real Name dynamically
    if (profileData && profileData.mentorId) {
      const mentorProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileData.mentorId).catch(() => null);
      if (mentorProfile && mentorProfile.fullName) {
         mentorName = mentorProfile.fullName;
         mentorEmail = mentorProfile.email || "";
         mentorDepartment = mentorProfile.department || "";
      }
    }
  } catch (error) {
    console.error("Dashboard overview data fetch failed:", error);
  }

  // Safe UI Fallbacks
  const displayDepartment = profileData?.department || "Pending Assignment";
  const studentName = profileData?.fullName || "Student";
  const totalPendingApprovals = pendingMeetingRequests.length + pendingAcademicApprovals.length + pendingAchievementApprovals.length;

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Dashboard</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-950">
            Welcome, {studentName}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Pandit Deendayal Energy University / {displayDepartment}
          </p>
        </div>
        <span className={`w-fit rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
          profileData?.isVerified
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-yellow-200 bg-yellow-50 text-yellow-700"
        }`}>
          {profileData?.isVerified ? "Verified" : "Verification Pending"}
        </span>
      </div>

      {!profileData?.isVerified && !isMentor ? (
        <div className="max-w-2xl rounded-lg border border-yellow-200 bg-white p-8 shadow-sm">
          <div className="mb-5 h-1.5 w-20 rounded-full bg-yellow-400" />
          <h3 className="text-xl font-bold text-slate-900">Verification Pending</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your onboarding details are under review. Once the administration verifies your account, your assigned faculty mentor and workspace tools will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={`rounded-lg border p-6 shadow-sm md:col-span-3 ${
                activeMeetings.length > 0 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
              }`}>
                {activeMeetings.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Scheduled Meetings</p>
                    <div className="mt-4 space-y-4">
                      {activeMeetings.map((meeting) => {
                        const details = getMeetingDetails(meeting);

                        return (
                          <div key={meeting.$id} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <h3 className="text-2xl font-bold text-slate-950">{meeting.topic || "Scheduled Meeting"}</h3>
                                <p className="mt-2 text-sm font-semibold text-slate-600">
                                  {meeting.date || "Date pending"}
                                  {details.time ? ` at ${details.time}` : ""}
                                  {details.mode ? ` / ${details.mode}` : ""}
                                </p>
                                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                  {details.agenda || "No agenda provided yet."}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col gap-2">
                                <span className="w-fit rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                                  {meeting.status === "Pending" ? "Personal" : meeting.status || "Scheduled"}
                                </span>
                                {details.link && (
                                  <a
                                    href={details.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                                  >
                                    Open Meeting Link
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
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Meetings</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950">No meeting scheduled</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">Your mentor has not scheduled an active meeting for you right now.</p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:col-span-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Academics</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <p className="text-2xl font-bold text-slate-900">
                    {academicData?.semester ? `Semester ${academicData.semester}` : "No Results Uploaded"}
                  </p>
                  <div className="flex gap-2">
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">CPI {academicData?.cpi || "N/A"}</span>
                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">SPI {academicData?.spi || "N/A"}</span>
                  </div>
                </div>
              </div>

              {!isMentor && (
                <div className={`rounded-lg border p-5 shadow-sm md:col-span-3 ${
                  totalPendingApprovals > 0 ? "border-yellow-200 bg-yellow-50" : "border-slate-200 bg-white"
                }`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        totalPendingApprovals > 0 ? "text-yellow-700" : "text-slate-400"
                      }`}>
                        Pending Approvals
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-950">
                        {totalPendingApprovals} item{totalPendingApprovals === 1 ? "" : "s"} awaiting mentor action
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg border border-yellow-200 bg-white px-3 py-1.5 text-xs font-bold text-yellow-700">
                        Meetings {pendingMeetingRequests.length}
                      </span>
                      <span className="rounded-lg border border-yellow-200 bg-white px-3 py-1.5 text-xs font-bold text-yellow-700">
                        Academics {pendingAcademicApprovals.length}
                      </span>
                      <span className="rounded-lg border border-yellow-200 bg-white px-3 py-1.5 text-xs font-bold text-yellow-700">
                        Achievements {pendingAchievementApprovals.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isMentor && pendingMeetingRequests.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-bold text-slate-900">Pending Meeting Requests</h3>
                  <p className="mt-1 text-xs text-slate-500">Waiting for mentor confirmation</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {pendingMeetingRequests.map((request) => (
                    <div key={request.$id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {request.proposedDate || request.date || "Date pending"}
                          {request.proposedTime ? ` at ${request.proposedTime}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{request.agenda || request.description}</p>
                      </div>
                      <span className="w-fit rounded-lg border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-yellow-700">
                        Requested
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <MeetingTableWrapper initialMeetings={meetings} profileId={profileId} isMentor={isMentor} />
          </div>

          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Mentor</p>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                {mentorName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{mentorName}</p>
                {mentorEmail && <p className="mt-1 truncate text-sm text-slate-500">{mentorEmail}</p>}
                {mentorDepartment && <p className="mt-1 text-sm text-slate-500">{mentorDepartment}</p>}
                {!profileData?.mentorId && (
                  <p className="mt-2 text-sm text-slate-500">Awaiting faculty assignment.</p>
                )}
              </div>
            </div>
            {!isMentor && isOwnProfile && profileData?.mentorId && (
              <MeetingRequestForm profileId={profileId} />
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
