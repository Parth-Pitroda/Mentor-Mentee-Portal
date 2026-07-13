import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import {
  getAcademicRecordsForProfile,
  getAchievementRecordsForProfile,
  getLatestAcademicRecord,
  getLatestNotices,
  getMenteeProfile,
  getMentorNote,
  getMentorRoster,
  getMentorScheduledMeetings,
  getPendingApprovals,
  getProfileByEmail,
  getStudentDirectory,
} from "@/lib/actions/student.actions";
import MentorSidebar from "@/components/MentorSidebar";
import MentorRosterExplorer from "@/components/MentorRosterExplorer";
import MentorRosterCards from "@/components/MentorRosterCards";
import MeetingsTabClient from "@/components/MeetingsTabClient";
import StudentDirectoryTable from "@/components/StudentDirectoryTable";
import AcademicsManager from "@/components/AcademicsManager";
import AchievementsManager from "@/components/AchievementsManager";
import MentorHeader from "@/src/components/MentorHeader";
import NoticeList from "@/src/components/NoticeList";
import StudentDossier from "@/src/components/StudentDossier";
import LoadingPage from "@/src/components/LoadingPage";
import ApprovalQueue from "@/src/components/ApprovalQueue";
import { initials, mentorTitle } from "@/src/utils/routing";

export default function MentorDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const studentId = searchParams.get("id") || "";
  const q = searchParams.get("q") || "";

  // 1. Fetch base dashboard data only ONCE (deps: [])
  const state = useAsyncData(async () => {
    const user = await getLoggedInUser();
    if (!user) return null;

    const [mentees, notices, scheduledMeetings, pendingApprovals, profile] = await Promise.all([
      getMentorRoster(user.$id),
      getLatestNotices(5),
      getMentorScheduledMeetings(user.$id),
      getPendingApprovals(user.$id),
      getProfileByEmail(user.email),
    ]);

    return { user, mentees, notices, scheduledMeetings, pendingApprovals, profile };
  }, []);

  // 2. Local state for tab-specific or student-specific data
  const [tabData, setTabData] = useState<{
    loading: boolean;
    directory: any[];
    selectedStudent: any;
    latestAcademicRecord: any;
    academicRecords: any[];
    achievementRecords: any[];
    mentorNote: any;
  }>({
    loading: false,
    directory: [],
    selectedStudent: null,
    latestAcademicRecord: null,
    academicRecords: [],
    achievementRecords: [],
    mentorNote: null,
  });

  // 3. Fetch tab/student data on parameter change without triggering global layout loading
  useEffect(() => {
    let active = true;
    const needsDirectory = activeTab === "directory";
    const needsStudent = !!(studentId && ["student-profile", "student-academics", "student-achievements"].includes(activeTab));

    if (!needsDirectory && !needsStudent) {
      setTabData((prev) => ({
        ...prev,
        loading: false,
        selectedStudent: null,
        latestAcademicRecord: null,
        academicRecords: [],
        achievementRecords: [],
        mentorNote: null,
      }));
      return;
    }

    // Skip loading and refetching if directory is already cached
    if (needsDirectory && tabData.directory.length > 0) {
      return;
    }

    const loadData = async () => {
      try {
        // 1. Check if the student profile is already cached in local memory
        const cachedStudent = 
          data.mentees?.find((m: any) => m.$id === studentId) ||
          tabData.directory?.find((m: any) => m.$id === studentId);

        if (cachedStudent) {
          // Render layout instantly in 0ms!
          setTabData((prev) => ({
            ...prev,
            selectedStudent: cachedStudent,
            loading: false,
          }));
        } else {
          // Set loading only if profile data isn't in memory
          setTabData((prev) => ({ ...prev, loading: true }));
        }

        const dirPromise = needsDirectory ? getStudentDirectory() : Promise.resolve([]);
        const studentPromise = needsStudent ? Promise.all([
          cachedStudent ? Promise.resolve(cachedStudent) : getMenteeProfile(studentId),
          getLatestAcademicRecord(studentId),
          getAcademicRecordsForProfile(studentId),
          getAchievementRecordsForProfile(studentId),
          getMentorNote(studentId),
        ]) : Promise.resolve([null, null, [], [], null]);

        const [directory, [student, latest, academics, achievements, note]] = await Promise.all([
          dirPromise,
          studentPromise,
        ]);

        if (active) {
          setTabData((prev) => ({
            ...prev,
            loading: false,
            directory: directory?.length ? directory : prev.directory,
            selectedStudent: student,
            latestAcademicRecord: latest,
            academicRecords: academics || [],
            achievementRecords: achievements || [],
            mentorNote: note,
          }));
        }
      } catch (err) {
        console.error("Error loading tab/student data:", err);
        if (active) {
          setTabData((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, studentId]);

  useEffect(() => {
    if (!state.loading && !state.data?.user) navigate("/sign-in", { replace: true });
  }, [navigate, state.data, state.loading]);

  if (state.loading || !state.data) return <LoadingPage label="Loading mentor dashboard..." />;

  const data = state.data as any;
  const pendingApprovalCount = data.pendingApprovals.meetings.length + data.pendingApprovals.meetingRequests.length + data.pendingApprovals.academics.length + data.pendingApprovals.achievements.length;
  const activeSidebarItem = ["meetings", "directory", "notices", "dashboard", "profile", "approvals"].includes(activeTab) ? activeTab : "roster";

  const backUrl = activeTab === "student-profile"
    ? "?tab=roster"
    : ["student-academics", "student-achievements"].includes(activeTab)
    ? `?tab=student-profile&id=${studentId}`
    : undefined;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-slate-200 selection:text-slate-900">
      <MentorSidebar activeItem={activeSidebarItem as any} pendingApprovalCount={pendingApprovalCount} userName={data.user.name} />
      <main className="min-h-screen p-6 md:ml-64 lg:p-10">
        <div className="mx-auto max-w-6xl">
          <MentorHeader title={mentorTitle(activeTab)} initials={initials(data.user.name)} showSearch={activeTab === "roster" || activeTab === "meetings"} backUrl={backUrl} />

          {activeTab === "dashboard" && (
            <MentorRosterExplorer mentees={data.mentees} showRosterTable={false} meetings={data.scheduledMeetings} pendingApprovalCount={pendingApprovalCount} pendingApprovals={data.pendingApprovals} />
          )}
          {activeTab === "roster" && <MentorRosterCards mentees={data.mentees} searchQuery={q} />}
          {activeTab === "meetings" && <MeetingsTabClient mentees={data.mentees} scheduledMeetings={data.scheduledMeetings} meetingRequests={data.pendingApprovals.meetingRequests} />}
          
          {activeTab === "directory" && (
            tabData.loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
              </div>
            ) : (
              <StudentDirectoryTable students={tabData.directory} />
            )
          )}
          
          {activeTab === "notices" && <NoticeList notices={data.notices} />}

          {activeTab === "approvals" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="mb-8 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1.5 shadow-sm lg:w-fit">
                {[
                  ["requests", "Meeting Requests", data.pendingApprovals.meetingRequests.length],
                  ["academics", "Academics", data.pendingApprovals.academics.length],
                  ["achievements", "Achievements", data.pendingApprovals.achievements.length],
                  ["meetings", "Meeting Logs", data.pendingApprovals.meetings.length],
                ].map(([key, label, count]) => {
                  const approvalTab = searchParams.get("approvalTab") || "requests";
                  return (
                    <Link
                      key={key as string}
                      to={`?tab=approvals&approvalTab=${key}`}
                      className={`rounded-lg px-4 py-2.5 text-sm font-bold ${
                        approvalTab === key
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {label as string} <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">{count as number}</span>
                    </Link>
                  );
                })}
              </div>
              <ApprovalQueue activeTab={searchParams.get("approvalTab") || "requests"} pending={data.pendingApprovals} />
            </div>
          )}
          
          {activeTab === "profile" && data.profile && (
            <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-150">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white text-3xl font-black shadow-md">
                  {initials(data.user.name)}
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{data.profile.fullName}</h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold uppercase text-[9px] tracking-wider">
                    Faculty Mentor
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">Faculty Information</h3>
                <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200 text-sm">
                  <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Full Name</span>
                  <span className="text-slate-900 font-extrabold">{data.profile.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200 text-sm">
                  <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Email Address</span>
                  <span className="text-slate-900 font-extrabold">{data.profile.email}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200 text-sm">
                  <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Department / Area</span>
                  <span className="text-slate-900 font-extrabold">{data.profile.department || "Faculty of Technology"}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200 text-sm">
                  <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Designation</span>
                  <span className="text-slate-900 font-extrabold">Assigned Faculty Mentor</span>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "student-profile" && (
            tabData.loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
              </div>
            ) : (
              tabData.selectedStudent && (
                <StudentDossier student={tabData.selectedStudent} user={data.user} latestAcademicRecord={tabData.latestAcademicRecord} achievementRecords={tabData.achievementRecords} mentorNote={tabData.mentorNote} />
              )
            )
          )}
          
          {activeTab === "student-academics" && (
            tabData.loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
              </div>
            ) : (
              tabData.selectedStudent && (
                <AcademicsManager initialRecords={tabData.academicRecords} profileId={tabData.selectedStudent.$id} isMentor />
              )
            )
          )}
          
          {activeTab === "student-achievements" && (
            tabData.loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
              </div>
            ) : (
              tabData.selectedStudent && (
                <AchievementsManager initialRecords={tabData.achievementRecords} profileId={tabData.selectedStudent.$id} isMentor />
              )
            )
          )}
        </div>
      </main>
    </div>
  );
}
