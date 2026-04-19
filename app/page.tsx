import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import StudentOnboarding from "@/components/forms/StudentOnboarding";
import { databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";
import Link from "next/link";

export default async function Home() {
  // 1. Get user session
  const user = await getLoggedInUser();

  // 2. Protect route
  if (!user) {
    redirect("/sign-in");
  }

  let existingProfileId = null;
  let profileData = null;

  // 3. Database Check
  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

    const result = await databases.listDocuments(
      DATABASE_ID,
      PROFILES_COLLECTION,
      [Query.equal("email", [user.email.toLowerCase()])]
    );

    if (result.total > 0) {
      existingProfileId = result.documents[0].$id;
      profileData = result.documents[0];
    }
  } catch (error) {
    console.error("Profile check failed:", error);
  }

  // 4. Render Onboarding if no profile exists
  if (!existingProfileId) {
    return (
      <main className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-slate-500 mt-3 text-lg">
              Let's set up your PDEU Mentor Portal profile.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white">
            <StudentOnboarding />
          </div>
        </div>
      </main>
    );
  }

  // 5. Render Dashboard UI (Idealab Aesthetic)
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Navbar Integration */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter text-blue-900">PDEU PORTAL</div>
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium text-slate-600">{user.name}</span>
             <div className="w-9 h-9 bg-blue-100 rounded-full border border-blue-200" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header Section */}
        <header>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 font-medium">Mentor Mentee Management System</p>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[200px]">
          
          {/* Main Welcome Card */}
          <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-[2.5rem] bg-blue-900 p-10 text-white shadow-2xl transition-all hover:shadow-blue-200/50">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <span className="inline-block px-4 py-1 rounded-full bg-blue-800 text-xs font-bold tracking-widest uppercase mb-4">
                  Active Session
                </span>
                <h2 className="text-3xl font-bold leading-tight">
                  Connect with your <br /> Assigned Mentor
                </h2>
              </div>
              <Link 
                href={`/dashboard/${existingProfileId}`}
                className="inline-flex items-center justify-center w-fit px-8 py-3 bg-white text-blue-900 rounded-full font-bold transition-transform hover:scale-105"
              >
                View Profile
              </Link>
            </div>
            {/* Decorative Element */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50" />
          </div>

          {/* Progress Card */}
          <div className="md:col-span-1 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center items-center text-center group hover:border-blue-200 transition-colors">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Attendance</p>
            <p className="text-5xl font-black text-blue-600 group-hover:scale-110 transition-transform">94%</p>
          </div>

          {/* Status Card */}
          <div className="md:col-span-1 bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] flex flex-col justify-center items-center text-center">
            <p className="text-emerald-600 text-sm font-bold uppercase tracking-widest mb-2">Status</p>
            <p className="text-2xl font-bold text-emerald-900">Verified</p>
          </div>

          {/* Quick Tasks / Feed */}
          <div className="md:col-span-2 md:row-span-1 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
            <div>
                <h3 className="text-xl font-bold text-slate-800">Latest Announcement</h3>
                <p className="text-slate-500 mt-1">Mid-term review scheduled for next Monday.</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl">
                📢
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}