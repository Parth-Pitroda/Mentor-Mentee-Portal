import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { checkUserRole, getAchievementRecordsForProfile } from "@/lib/actions/student.actions";
import AchievementsManager from "@/components/AchievementsManager";
import LoadingPage from "@/src/components/LoadingPage";
import type { DashboardContext } from "@/src/types/app.types";

export default function AchievementsPage() {
  const { profileId, user } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => {
    const [role, records] = await Promise.all([
      checkUserRole(user.email),
      getAchievementRecordsForProfile(profileId),
    ]);
    return { role, records };
  }, [profileId, user.email]);

  if (state.loading) return <LoadingPage label="Loading achievements..." />;
  return <AchievementsManager initialRecords={(state.data?.records || []) as any[]} profileId={profileId} isMentor={["mentor", "admin", "coordinator"].includes(String(state.data?.role))} />;
}
