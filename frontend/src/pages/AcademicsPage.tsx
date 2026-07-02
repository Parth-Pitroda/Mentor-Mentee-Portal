import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { checkUserRole, getAcademicRecordsForProfile } from "@/lib/actions/student.actions";
import AcademicsManager from "@/components/AcademicsManager";
import LoadingPage from "@/src/components/LoadingPage";
import type { DashboardContext } from "@/src/types/app.types";

export default function AcademicsPage() {
  const { profileId, user } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => {
    const [role, records] = await Promise.all([
      checkUserRole(user.email),
      getAcademicRecordsForProfile(profileId),
    ]);
    return { role, records };
  }, [profileId, user.email]);

  if (state.loading) return <LoadingPage label="Loading academics..." />;
  return <AcademicsManager initialRecords={(state.data?.records || []) as any[]} profileId={profileId} isMentor={["mentor", "admin", "coordinator"].includes(String(state.data?.role))} />;
}
