import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { checkUserRole, getMeetings } from "@/lib/actions/student.actions"; // Note: verify getMeetings is the exact name of your fetcher function!
import { redirect } from "next/navigation";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";

export default async function MeetingsPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // ✅ Securely check the role using our helper
  const role = await checkUserRole(user.email);
  const isMentor = role === "mentor" || role === "admin" || role === "coordinator";

  // ✅ THE DRY FIX: One line to fetch the data
  const meetings = await getMeetings(profileId) || [];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Meeting Logs</h2>
      </div>

      <MeetingTableWrapper 
        initialMeetings={meetings} 
        profileId={profileId} 
        isMentor={isMentor}
      />
    </div>
  );
}