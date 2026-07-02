import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import {
  getAchievementRecordsForProfile,
  getLatestAcademicRecord,
  getMentorNote,
  getStudentProfile,
} from "@/lib/actions/student.actions";
import MentorSidebar from "@/components/MentorSidebar";
import StudentDossier from "@/src/components/StudentDossier";
import LoadingPage from "@/src/components/LoadingPage";
import ErrorPanel from "@/src/components/ErrorPanel";
import type { UserProfile, AchievementRecord } from "@/types";

export default function MentorStudentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const state = useAsyncData(async () => {
    const user = await getLoggedInUser();
    if (!user) return null;
    const [studentData, latestAcademicRecord, achievementRecords, mentorNote] = await Promise.all([
      getStudentProfile(id),
      getLatestAcademicRecord(id),
      getAchievementRecordsForProfile(id),
      getMentorNote(id),
    ]);
    return { user, student: (studentData as any)?.profile || studentData, latestAcademicRecord, achievementRecords, mentorNote };
  }, [id]);

  useEffect(() => {
    if (!state.loading && !state.data?.user) navigate("/sign-in", { replace: true });
  }, [navigate, state.data, state.loading]);

  if (state.loading || !state.data) return <LoadingPage label="Loading student profile..." />;
  if (!state.data.student) return <ErrorPanel message="Student not found." />;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <MentorSidebar activeItem="roster" userName={state.data.user.name} />
      <main className="min-h-screen p-6 md:ml-64 lg:p-10">
        <StudentDossier student={state.data.student as UserProfile} user={state.data.user} latestAcademicRecord={state.data.latestAcademicRecord} achievementRecords={state.data.achievementRecords as AchievementRecord[]} mentorNote={state.data.mentorNote} />
      </main>
    </div>
  );
}
