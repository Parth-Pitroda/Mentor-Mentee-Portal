import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { databases } from "@/lib/appwrite/config";

export default async function ProfilePage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let profileData = null;

  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

    const profileRes = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileId);
    profileData = JSON.parse(JSON.stringify(profileRes));
  } catch (error) {
    console.error("Profile data fetch failed:", error);
  }

  // Using your specific PDEU details as clean fallbacks if the database fields are empty
  const studentName = profileData?.fullName || user.name || "Parth Yogesh Pitroda";
  const rollNumber = profileData?.rollNo || "24BCP413D";
  const department = profileData?.department || "Computer Science & Engineering";
  const email = user.email || "student@sot.pdpu.ac.in";

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Mentorship Profile</h2>
        <p className="text-slate-500 mt-1 font-medium">
          Manage your academic identity and mentorship assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Student Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Student Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-slate-800 font-medium">{studentName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Roll Number</p>
                <p className="text-slate-800 font-medium">{rollNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">University Email</p>
                <p className="text-slate-800 font-medium">{email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Branch/Department</p>
                <p className="text-slate-800 font-medium">{department}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button className="text-sm px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Mentor Details */}
        <div className="space-y-6">
          <div className="bg-blue-900 rounded-xl border border-blue-800 shadow-md overflow-hidden text-white">
            <div className="p-6 border-b border-blue-800/50 flex items-center justify-between">
              <h3 className="font-bold text-lg text-blue-50">Assigned Mentor</h3>
              <span className="px-2.5 py-1 bg-blue-800 text-blue-200 rounded text-xs font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-800 rounded-full flex items-center justify-center text-xl font-bold mb-4 border-2 border-blue-700">
                RM
              </div>
              <h4 className="text-xl font-bold mb-1">Dr. R.K. Mehta</h4>
              <p className="text-blue-300 text-sm mb-6">Department of Computer Science</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Office Location</p>
                  <p className="text-sm">Block C, Room 204</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-sm">rk.mehta@sot.pdpu.ac.in</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-blue-950/50 border-t border-blue-800/50">
              <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm">
                Request Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}