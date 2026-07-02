import { useEffect } from "react";
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

  const state = useAsyncData(async () => {
    const user = await getLoggedInUser();
    if (!user) return null;

    const [mentees, notices, scheduledMeetings, pendingApprovals, directory] = await Promise.all([
      getMentorRoster(user.$id),
      getLatestNotices(5),
      getMentorScheduledMeetings(user.$id),
      getPendingApprovals(user.$id),
      activeTab === "directory" ? getStudentDirectory() : Promise.resolve([]),
    ]);

    let selectedStudent: any = null;
    let latestAcademicRecord: any = null;
    let academicRecords: any[] = [];
    let achievementRecords: any[] = [];
    let mentorNote: any = null;

    if (studentId && ["student-profile", "student-academics", "student-achievements"].includes(activeTab)) {
      const [student, latest, academics, achievements, note] = await Promise.all([
        getMenteeProfile(studentId),
        getLatestAcademicRecord(studentId),
        getAcademicRecordsForProfile(studentId),
        getAchievementRecordsForProfile(studentId),
        getMentorNote(studentId),
      ]);
      selectedStudent = student;
      latestAcademicRecord = latest;
      academicRecords = academics as any[];
      achievementRecords = achievements as any[];
      mentorNote = note;
    }

    return { user, mentees, notices, scheduledMeetings, pendingApprovals, directory, selectedStudent, latestAcademicRecord, academicRecords, achievementRecords, mentorNote };
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
          {activeTab === "directory" && <StudentDirectoryTable students={data.directory} />}
          {activeTab === "notices" && <NoticeList notices={data.notices} />}
          {activeTab === "student-profile" && data.selectedStudent && (
            <StudentDossier student={data.selectedStudent} user={data.user} latestAcademicRecord={data.latestAcademicRecord} achievementRecords={data.achievementRecords} mentorNote={data.mentorNote} />
          )}
          {activeTab === "student-academics" && data.selectedStudent && <AcademicsManager initialRecords={data.academicRecords} profileId={data.selectedStudent.$id} isMentor />}
          {activeTab === "student-achievements" && data.selectedStudent && <AchievementsManager initialRecords={data.achievementRecords} profileId={data.selectedStudent.$id} isMentor />}
        </div>
      </main>
    </div>
  );
}
