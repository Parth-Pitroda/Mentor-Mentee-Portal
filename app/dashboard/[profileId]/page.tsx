import { databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";

export default async function DashboardOverviewPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  let profileData = null;
  let meetings = [];
  let academicData = null;

  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
    const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;
    const ACADEMICS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!; 

    const [profileRes, meetingsRes, academicsRes] = await Promise.all([
      // Add .catch(() => null) so it doesn't crash if the profile is missing
      databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileId).catch(() => null),
      
      // Add safe fallbacks for the lists too
      databases.listDocuments(DATABASE_ID, MEETINGS_COLLECTION, [
        Query.equal("studentId", profileId),
        Query.orderDesc("$createdAt"),
        Query.limit(3)
      ]).catch(() => ({ documents: [] })),
      
      databases.listDocuments(DATABASE_ID, ACADEMICS_COLLECTION, [
        Query.equal("studentId", profileId),
        Query.orderDesc("$createdAt"),
        Query.limit(1)
      ]).catch(() => ({ documents: [] }))
    ]);

    // Only parse the profile if it actually exists!
    profileData = profileRes ? JSON.parse(JSON.stringify(profileRes)) : null;
    meetings = JSON.parse(JSON.stringify(meetingsRes.documents));
    academicData = academicsRes.documents.length > 0 ? JSON.parse(JSON.stringify(academicsRes.documents[0])) : null;
    
  } catch (error) {
    console.error("Data fetch failed:", error);
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
          Welcome, {profileData?.fullName || "Student"} {/* <-- Changed to fullName */}
       </h2>
        <p className="text-slate-500 mt-1 font-medium">
           Pandit Deendayal Energy University • {profileData?.department || "Department"} 
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">94.2%</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academics</h3>
          <p className="text-xl font-bold text-slate-800 mt-2">
            {academicData?.semester ? `Semester ${academicData.semester}` : "No Data"}
          </p>
          <div className="flex gap-4 mt-1">
            <p className="text-sm text-slate-500 font-medium">CPI: <span className="text-blue-600">{academicData?.cpi || "N/A"}</span></p>
            <p className="text-sm text-slate-500 font-medium">SPI: <span className="text-blue-600">{academicData?.spi || "N/A"}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Mentor</h3>
          <p className="text-xl font-bold text-slate-800 mt-2">Dr. R.K. Mehta</p>
        </div>
      </div>

      <MeetingTableWrapper initialMeetings={meetings} profileId={profileId} />
    </>
  );
}