import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getDashboardOverview } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";

function getInitials(name?: string) {
  return (name || "Mentor")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function ProfilePage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let mentor = null;

  try {
    const overview = await getDashboardOverview(profileId);
    if (overview?.mentor) {
      mentor = overview.mentor;
    }
  } catch (error) {
    console.error("Profile data fetch failed:", error);
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {!mentor ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Mentor Assigned</h3>
          <p className="text-slate-500 text-sm mt-2">
            Your faculty mentor has not been assigned yet. This information will update automatically once verified.
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Avatar Initial Box */}
            <div className="lg:col-span-1 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900" />
              
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-2xl font-black text-white shadow-md">
                {getInitials(mentor.fullName)}
              </div>
              
              <h3 className="text-lg font-black text-slate-900">{mentor.fullName}</h3>
              <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-wide">Faculty Mentor</p>
              
              <div className="mt-6 flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-4 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm select-none">
                Primary Mentor
              </div>
            </div>

            {/* Right Column: Profile details list */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-6 pb-2 border-b border-slate-100">
                Mentor Profile Details
              </h3>
              
              <div className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
                <div className="pb-3 border-b border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Full Name</p>
                  <p className="text-sm font-extrabold text-slate-800">{mentor.fullName || "N/A"}</p>
                </div>
                
                <div className="pb-3 border-b border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                  <p className="text-sm font-semibold text-slate-750">{mentor.email || "N/A"}</p>
                </div>

                <div className="pb-3 border-b border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">System Role</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">Faculty Mentor</p>
                </div>

                <div className="pb-3 border-b border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Department</p>
                  <p className="text-sm font-semibold text-slate-700">{mentor.department || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
