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
  // 1. Await params (Next.js 15)
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let meetings = [];

  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    // Using the exact variable name from your .env
    const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;

    // Fetch ALL meetings for this student
    const meetingsRes = await databases.listDocuments(DATABASE_ID, MEETINGS_COLLECTION, [
      Query.equal("studentId", profileId),
      Query.orderDesc("$createdAt")
    ]);

    // Sanitize the Appwrite objects for the Client Component
    meetings = JSON.parse(JSON.stringify(meetingsRes.documents));
    
  } catch (error) {
    console.error("Meetings data fetch failed:", error);
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Meeting Logs</h2>
        <p className="text-slate-500 mt-1 font-medium">
          A complete history of your mentorship sessions and discussion notes.
        </p>
      </div>

      {/* We can reuse the exact same wrapper component! 
        It already has the "New Meeting" and "View Details" modals built-in.
      */}
      <MeetingTableWrapper 
        initialMeetings={meetings} 
        profileId={profileId} 
      />
    </div>
  );
}