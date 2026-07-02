import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { checkUserRole, getMeetings } from "@/lib/actions/student.actions";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";
import LoadingPage from "@/src/components/LoadingPage";
import type { DashboardContext } from "@/src/types/app.types";

export default function StudentMeetingsPage() {
  const { profileId, user } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => {
    const [role, meetings] = await Promise.all([
      checkUserRole(user.email),
      getMeetings(profileId),
    ]);
    return { role, meetings };
  }, [profileId, user.email]);

  if (state.loading) return <LoadingPage label="Loading meetings..." />;
  return <MeetingTableWrapper initialMeetings={(state.data?.meetings || []) as any[]} profileId={profileId} isMentor={["mentor", "admin", "coordinator"].includes(String(state.data?.role))} />;
}
