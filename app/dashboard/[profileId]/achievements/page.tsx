import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { Client, Databases, Query } from "node-appwrite";
import AchievementsManager from "@/components/AchievementsManager";

export default async function AchievementsPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let achievements = [];
  let isMentor = false;

  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(client);

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
    const ACHIEVEMENTS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!; 

    // Check if user is a mentor
    const currentUserProfile = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION, [
      Query.equal("email", [user.email.toLowerCase()])
    ]);
    
    if (currentUserProfile.total > 0 && currentUserProfile.documents[0].role === "mentor") {
      isMentor = true;
    }

    // Fetch achievements
    const achievementsRes = await databases.listDocuments(DATABASE_ID, ACHIEVEMENTS_COLLECTION, [
      Query.equal("studentId", profileId),
      Query.orderDesc("$createdAt") 
    ]);
    achievements = JSON.parse(JSON.stringify(achievementsRes.documents));
    
  } catch (error) {
    console.error("Achievements data fetch failed:", error);
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Extra-Curricular Achievements</h2>
        <p className="text-slate-500 mt-1 font-medium">
          Track and verify Hackathons, Internships, Exams, and Certifications.
        </p>
      </div>

      <AchievementsManager 
        initialRecords={achievements} 
        profileId={profileId} 
        isMentor={isMentor} 
      />
    </div>
  );
}