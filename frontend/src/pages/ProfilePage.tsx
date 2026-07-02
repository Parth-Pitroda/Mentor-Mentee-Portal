import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getDashboardOverview } from "@/lib/actions/student.actions";
import ProfileManager from "@/components/ProfileManager";
import LoadingPage from "@/src/components/LoadingPage";
import ErrorPanel from "@/src/components/ErrorPanel";
import type { DashboardContext } from "@/src/types/app.types";

export default function ProfilePage() {
  const { profileId, user } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => getDashboardOverview(profileId), [profileId]);
  const overview = state.data as any;

  if (state.loading) return <LoadingPage label="Loading profile..." />;
  if (!overview?.profile) return <ErrorPanel message="Profile information could not be loaded." />;

  return (
    <ProfileManager
      profileData={overview.profile}
      mentorName={overview.mentor?.fullName || "Not Assigned"}
      isOwnProfile={overview.profile.email === user.email}
    />
  );
}
