import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getMenteeProfile } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";

export default async function StudentDashboardPage() {
  // 1. Get the Auth User
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // 2. Get their full Database Profile
  const profile = await getMenteeProfile(user.$id);
  
  // Safety catch: If they somehow bypassed onboarding, send them back
  if (!profile || profile.department === "Unassigned") {
    redirect("/onboarding"); 
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">Student Dashboard</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="block px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-700">
            My Hub
          </div>
        </nav>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <LogoutButton />
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Welcome, {profile.fullName.split(' ')[0]}!
              </h1>
              <p className="text-slate-500 mt-1">
                {profile.department} • Semester {profile.semester}
              </p>
            </div>
            <div className="mt-1">
              <NotificationBell />
            </div>
          </div>

          {/* === CONDITIONAL RENDERING BASED ON VERIFICATION === */}
          {!profile.isVerified ? (
            
            // VIEW A: NOT VERIFIED YET
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center animate-in fade-in duration-500">
               <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                  ⏳
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">Verification Pending</h3>
               <p className="text-slate-500 max-w-md mx-auto">
                 Your onboarding details are currently under review. Once the administration verifies your account, you will be officially assigned a faculty mentor.
               </p>
            </div>

          ) : (

            // VIEW B: VERIFIED AND ACTIVE!
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-sm text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">✅</div>
                    <h3 className="text-xl font-bold">Officially Verified</h3>
                  </div>
                  <p className="text-green-50 font-medium">Your university profile is active and fully integrated into the PDEU Mentor system.</p>
                </div>

                {/* Mentor Assignment Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Assigned Mentor</h3>
                  
                  {profile.mentorId ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xl font-bold shadow-sm">
                        M
                      </div>
                      <div>
                        {/* Note: You can fetch the actual mentor's name from the DB later! */}
                        <p className="font-bold text-slate-800 text-lg">Faculty Member Assigned</p>
                        <p className="text-sm text-slate-500">Check notices for upcoming meetings.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Verified, pending final faculty matching.</p>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}