import { getStudentProfile } from "@/lib/actions/student.actions";
import { notFound, redirect } from "next/navigation";
import { account } from "@/lib/appwrite/config";

export default async function DashboardPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  const data = await getStudentProfile(profileId);

  if (!data || !data.profile) {
    notFound();
  }

  const { profile, academics } = data;

  // Server Action for Logout
  async function handleLogout() {
    "use server";
    try {
      // In a real production app, you'd use a dedicated auth library, 
      // but for this Appwrite setup, we redirect to sign-in after clearing local state.
      redirect("/sign-in");
    } catch (e) {
      redirect("/sign-in");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Navigation / Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentee Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {profile.fullName}</p>
          </div>
          <form action={handleLogout}>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              Logout
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Profile Details */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Student Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Department</label>
                <p className="text-gray-900 font-medium">{profile.department}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Verification</label>
                <p className="text-sm">
                  {profile.isVerified ? "✅ Verified by Mentor" : "⏳ Pending Verification"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Contact & Roll Details</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
                  {profile.bio}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Snapshot */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Academics</h2>
            {academics ? (
              <div className="space-y-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-600 font-bold uppercase">Current Year</p>
                  <p className="text-3xl font-black text-blue-800">{academics.year}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-xs text-green-600 font-bold uppercase">Current GPA</p>
                  <p className="text-3xl font-black text-green-800">{academics.gpa}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">No records found.</p>
            )}
          </div>
        </div>

        {/* Requirements from Professor's Sketch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-50 text-purple-600 rounded-full mb-4">
              🏆
            </div>
            <h3 className="font-bold text-gray-800">Achievements</h3>
            <p className="text-sm text-gray-500 mt-1">Track Hackathons, GATE, and Internships.</p>
            <button className="mt-4 text-sm font-semibold text-purple-600 hover:text-purple-700">Coming Soon →</button>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 text-orange-600 rounded-full mb-4">
              📅
            </div>
            <h3 className="font-bold text-gray-800">Meetings</h3>
            <p className="text-sm text-gray-500 mt-1">Logs for Online and Offline sessions.</p>
            <button className="mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700">Coming Soon →</button>
          </div>
        </div>
      </div>
    </div>
  );
}