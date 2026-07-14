import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getMeetings } from "@/lib/actions/student.actions";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";
import LoadingPage from "@/src/components/LoadingPage";
import type { DashboardContext } from "@/src/types/app.types";

export default function StudentMeetingsPage() {
  const { profileId, profile } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => getMeetings(profileId), [profileId]);

  if (state.loading) return <LoadingPage label="Loading meetings..." />;
  const isMentor = ["mentor", "admin", "coordinator"].includes(String(profile?.role));
  return <MeetingTableWrapper initialMeetings={(state.data || []) as any[]} profileId={profileId} isMentor={isMentor} />;
}
