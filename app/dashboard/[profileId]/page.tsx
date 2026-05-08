import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { Client, Databases, Query } from "node-appwrite";
import MeetingTableWrapper from "@/components/MeetingTableWrapper";

export default async function DashboardOverviewPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let profileData = null;
  let meetings = [];
  let academicData = null;
  let isMentor = false;
  let mentorName = "Pending Assignment";

  try {
    // 1. Securely initialize the Server Client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(client);

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
    const MEETINGS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_MEETINGS_COLLECTION_ID!;
    const ACADEMICS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_COLLECTION_ID!; 

    // 2. Role Check for the Logged-in User
    const currentUserProfile = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION, [
      Query.equal("email", [user.email.toLowerCase()])
    ]);
    
    if (currentUserProfile.total > 0 && currentUserProfile.documents[0].role === "mentor") {
      isMentor = true;
    }

    // 3. Fetch Student Profile, Recent Meetings, and Most Recent Academic Record
    const [profileRes, meetingsRes, academicsRes] = await Promise.all([
      databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileId).catch(() => null),
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

    profileData = profileRes ? JSON.parse(JSON.stringify(profileRes)) : null;
    meetings = JSON.parse(JSON.stringify(meetingsRes.documents));
    academicData = academicsRes.documents.length > 0 ? JSON.parse(JSON.stringify(academicsRes.documents[0])) : null;
    
    // 4. Resolve the Primary Mentor's Real Name dynamically
    if (profileData && profileData.mentorId) {
      const mentorProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileData.mentorId).catch(() => null);
      if (mentorProfile && mentorProfile.fullName) {
         mentorName = mentorProfile.fullName;
      }
    }
  } catch (error) {
    console.error("Dashboard overview data fetch failed:", error);
  }

  // Safe UI Fallbacks
  const displayAttendance = profileData?.attendance ? `${profileData.attendance}%` : "Pending";
  const displayDepartment = profileData?.department || "Pending Assignment";
  const studentName = profileData?.fullName || "Student";

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
          Welcome, {studentName}
       </h2>
        <p className="text-slate-500 mt-1 font-medium">
           Pandit Deendayal Energy University • {displayDepartment} 
         </p>
      </div>

      {/* DYNAMIC TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Attendance</h3>
          <p className={`text-3xl font-bold mt-2 ${displayAttendance === "Pending" ? "text-slate-400" : "text-blue-600"}`}>
            {displayAttendance}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Academics</h3>
          <p className="text-xl font-bold text-slate-800 mt-2">
            {academicData?.semester ? `Semester ${academicData.semester}` : "No Results Uploaded"}
          </p>
          <div className="flex gap-4 mt-1">
            <p className="text-sm text-slate-500 font-medium">CPI: <span className="text-blue-600">{academicData?.cpi || "N/A"}</span></p>
            <p className="text-sm text-slate-500 font-medium">SPI: <span className="text-blue-600">{academicData?.spi || "N/A"}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Mentor</h3>
          <p className="text-xl font-bold text-slate-800 mt-2">{mentorName}</p>
        </div>
      </div>

      <MeetingTableWrapper initialMeetings={meetings} profileId={profileId} isMentor={isMentor} />
    </div>
  );
}