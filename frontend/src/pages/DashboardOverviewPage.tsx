import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getDashboardOverview } from "@/lib/actions/student.actions";
import MeetingsWidget from "@/components/dashboard/MeetingsWidget";
import NoticeBoard from "@/components/dashboard/NoticeBoard";
import AchievementsWidget from "@/components/dashboard/AchievementsWidget";
import StatCard from "@/src/components/StatCard";
import LoadingPage from "@/src/components/LoadingPage";
import ErrorPanel from "@/src/components/ErrorPanel";
import type { DashboardContext } from "@/src/types/app.types";

export default function DashboardOverviewPage() {
  const { profileId } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => getDashboardOverview(profileId), [profileId]);
  const overview = state.data as any;

  if (state.loading) return <LoadingPage label="Loading dashboard..." />;
  if (!overview) return <ErrorPanel message="Dashboard information could not be loaded." />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Mentor" value={overview.mentor?.fullName || "Not assigned"} />
          <StatCard label="Meetings" value={overview.meetings?.length || 0} />
          <StatCard label="Achievements" value={overview.achievements?.length || 0} />
        </div>
        <MeetingsWidget studentId={profileId} initialData={overview.meetings || []} />
      </div>
      <div className="space-y-6">
        <NoticeBoard />
        <AchievementsWidget studentId={profileId} initialData={overview.achievements || []} />
      </div>
    </div>
  );
}
