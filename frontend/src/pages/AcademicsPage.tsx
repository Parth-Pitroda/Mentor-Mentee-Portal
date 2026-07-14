import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getAcademicRecordsForProfile } from "@/lib/actions/student.actions";
import AcademicsManager from "@/components/AcademicsManager";
import LoadingPage from "@/src/components/LoadingPage";
import type { DashboardContext } from "@/src/types/app.types";

export default function AcademicsPage() {
  const { profileId, profile } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => getAcademicRecordsForProfile(profileId), [profileId]);

  if (state.loading) return <LoadingPage label="Loading academics..." />;
  const isMentor = ["mentor", "admin", "coordinator"].includes(String(profile?.role));
  return <AcademicsManager initialRecords={(state.data || []) as any[]} profileId={profileId} isMentor={isMentor} />;
}
