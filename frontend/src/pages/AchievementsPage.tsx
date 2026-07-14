import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getAchievementRecordsForProfile } from "@/lib/actions/student.actions";
import AchievementsManager from "@/components/AchievementsManager";
import LoadingPage from "@/src/components/LoadingPage";
import type { DashboardContext } from "@/src/types/app.types";

export default function AchievementsPage() {
  const { profileId, profile } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => getAchievementRecordsForProfile(profileId), [profileId]);

  if (state.loading) return <LoadingPage label="Loading achievements..." />;
  const isMentor = ["mentor", "admin", "coordinator"].includes(String(profile?.role));
  return <AchievementsManager initialRecords={(state.data || []) as any[]} profileId={profileId} isMentor={isMentor} />;
}
