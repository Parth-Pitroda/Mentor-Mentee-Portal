import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { Client, Databases } from "node-appwrite";

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

  try {
    // Securely initialize the Server Client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(client);

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

    // 1. Fetch the exact Profile Document
    const profileRes = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileId);
    profileData = JSON.parse(JSON.stringify(profileRes));

    // 2. Resolve the Mentor's Name (if they have one)
    if (profileData && profileData.mentorId) {
      const mentorRes = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, profileData.mentorId).catch(() => null);
      if (mentorRes && mentorRes.fullName) {
         mentorName = mentorRes.fullName;
      }
    }
  } catch (error) {
    console.error("Profile data fetch failed:", error);
  }

  // Fallback if the database lookup fails
  if (!profileData) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Profile information could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Mentorship Profile</h2>
        <p className="text-slate-500 mt-1 font-medium">
          Personal details, academic department, and system status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CARD 1: Identity & Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">
            Identity Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Full Name</p>
              <p className="text-lg font-medium text-slate-800">{profileData.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">University Email</p>
              <p className="text-slate-700">{profileData.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">System Role</p>
              <p className="capitalize text-slate-700">{profileData.role}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Verification Status</p>
              {profileData.isVerified ? (
                <span className="inline-block px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-md text-xs font-bold uppercase">
                  Verified Account
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-md text-xs font-bold uppercase">
                  Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: Academics & Skills */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">
              Academic Assignment
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Department</p>
                <p className="text-slate-800 font-medium">{profileData.department || "Not Specified"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Primary Mentor</p>
                <p className="text-blue-700 font-medium">{mentorName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Registered Skills
            </h3>
            {profileData.skills && profileData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill: string, index: number) => (
                  <span key={index} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium border border-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No skills registered yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}