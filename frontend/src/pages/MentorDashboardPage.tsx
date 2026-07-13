import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

    const [mentees, notices, scheduledMeetings, pendingApprovals] = await Promise.all([
      getMentorRoster(user.$id),
      getLatestNotices(5),
      getMentorScheduledMeetings(user.$id),
      getPendingApprovals(user.$id),
    ]);

    return { user, mentees, notices, scheduledMeetings, pendingApprovals };
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
      setTabData({
        loading: false,
        directory: [],
        selectedStudent: null,
        latestAcademicRecord: null,
        academicRecords: [],
        achievementRecords: [],
        mentorNote: null,
      });
      return;
    }

    setTabData((prev) => ({ ...prev, loading: true }));

    const loadData = async () => {
      try {
        const dirPromise = needsDirectory ? getStudentDirectory() : Promise.resolve([]);
        const studentPromise = needsStudent ? Promise.all([
          getMenteeProfile(studentId),
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
          setTabData({
            loading: false,
            directory: directory || [],
            selectedStudent: student,
            latestAcademicRecord: latest,
            academicRecords: academics || [],
            achievementRecords: achievements || [],
            mentorNote: note,
          });
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
  }, [activeTab, studentId]);

  useEffect(() => {
    if (!state.loading && !state.data?.user) navigate("/sign-in", { replace: true });
  }, [navigate, state.data, state.loading]);

  if (state.loading || !state.data) return <LoadingPage label="Loading mentor dashboard..." />;

  const data = state.data as any;
  const pendingApprovalCount = data.pendingApprovals.meetings.length + data.pendingApprovals.meetingRequests.length + data.pendingApprovals.academics.length + data.pendingApprovals.achievements.length;
  const activeSidebarItem = ["meetings", "directory", "notices", "dashboard"].includes(activeTab) ? activeTab : "roster";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-slate-200 selection:text-slate-900">
      <MentorSidebar activeItem={activeSidebarItem as any} pendingApprovalCount={pendingApprovalCount} userName={data.user.name} />
      <main className="min-h-screen p-6 md:ml-64 lg:p-10">
        <div className="mx-auto max-w-6xl">
          <MentorHeader title={mentorTitle(activeTab)} initials={initials(data.user.name)} showSearch={activeTab === "roster" || activeTab === "meetings"} />

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
