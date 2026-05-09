import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { Client, Databases } from "node-appwrite";
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
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(client);

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

    const profileRes = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileId);
    profileData = JSON.parse(JSON.stringify(profileRes));

    // Determine if the logged-in user is looking at their OWN profile
    if (profileData && profileData.email === user.email) {
      isOwnProfile = true;
    }

    if (profileData && profileData.mentorId) {
      const mentorRes = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileData.mentorId).catch(() => null);
      if (mentorRes && mentorRes.fullName) {
         mentorName = mentorRes.fullName;
      }
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