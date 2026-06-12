import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getDashboardOverview } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import ProfileManager from "@/components/ProfileManager";

export default async function ProfilePage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let profileData = null;
  let mentorName = "Not Assigned";
  let isOwnProfile = false;

  try {
    const overview = await getDashboardOverview(profileId);
    profileData = overview?.profile || null;

    if (profileData && profileData.email === user.email) {
      isOwnProfile = true;
    }

    if (overview?.mentor?.fullName) {
      mentorName = overview.mentor.fullName;
    }
  } catch (error) {
    console.error("Profile data fetch failed:", error);
  }

  if (!profileData) {
    return <div className="p-8 text-center text-slate-500">Profile information could not be loaded.</div>;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <ProfileManager 
        profileData={profileData} 
        mentorName={mentorName} 
        isOwnProfile={isOwnProfile} 
      />
    </div>
  );
} 
