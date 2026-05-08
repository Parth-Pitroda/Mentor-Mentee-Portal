import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";

export default async function MeetingsPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let meetings = [];
  let isMentor = false;

  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

    // 1. Check if the currently logged-in user is a Mentor
    const currentUserProfile = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION, [
      Query.equal("email", [user.email.toLowerCase()])
    ]);
    
    if (currentUserProfile.total > 0 && currentUserProfile.documents[0].role === "mentor") {
      isMentor = true;
    }

    // 2. Fetch all meetings for this specific student
    const meetingsRes = await databases.listDocuments(DATABASE_ID, MEETINGS_COLLECTION, [
      Query.equal("studentId", profileId),
      Query.orderDesc("date") // Sorts by newest date first
    ]);

    meetings = JSON.parse(JSON.stringify(meetingsRes.documents));
    
  } catch (error) {
    console.error("Meetings data fetch failed:", error);
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Meeting Logs</h2>
        <p className="text-slate-500 mt-1 font-medium">
          A complete history of your mentorship sessions and discussion notes.
        </p>
      </div>

      {/* We pass the isMentor boolean down to unlock the verification buttons */}
      <MeetingTableWrapper 
        initialMeetings={meetings} 
        profileId={profileId} 
        isMentor={isMentor}
      />
    </div>
  );
}