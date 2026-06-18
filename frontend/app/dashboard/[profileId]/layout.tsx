import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getMenteeProfile, getProfileByEmail } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import DashboardSidebarNav from "@/components/DashboardSidebarNav";

type DashboardProfile = {
  $id: string;
  email?: string;
  role?: string;
  mentorId?: string;
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const user = await getLoggedInUser();
  
  if (!user) redirect("/sign-in");

  let currentProfile: DashboardProfile | null = null;
  let targetProfile: DashboardProfile | null = null;

  try {
    const [fetchedCurrentProfile, fetchedTargetProfile] = await Promise.all([
      getProfileByEmail(user.email),
      getMenteeProfile(profileId),
    ]);

    currentProfile = fetchedCurrentProfile as DashboardProfile | null;
    targetProfile = fetchedTargetProfile as DashboardProfile | null;
  } catch (error) {
    console.error("Dashboard access check failed:", error);
    redirect("/sign-in");
  }

  if (!currentProfile || !targetProfile) redirect("/sign-in");

  if (currentProfile.role === "mentor") {
    if (targetProfile.mentorId === currentProfile.$id) {
      redirect(`/mentor-dashboard?tab=student-profile&id=${profileId}`);
    }
    redirect("/mentor-dashboard");
  }

  if (targetProfile.email?.toLowerCase() !== user.email.toLowerCase()) {
    redirect(`/dashboard/${currentProfile.$id}`);
  }

  // Redirect to onboarding if this is the student's own workspace and they haven't completed onboarding yet
  if (currentProfile.role === "mentee" || !currentProfile.role) {
    const isProfileComplete =
      (currentProfile as any).department &&
      (currentProfile as any).department !== "Pending Assignment" &&
      (currentProfile as any).department !== "Unassigned";

    if (!isProfileComplete) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-slate-200 selection:text-slate-900">
      
      {/* ================= FULL-HEIGHT SIDEBAR ================= */}
      <aside className="fixed top-0 left-0 z-20 hidden h-screen w-[17rem] flex-col border-r border-slate-200 bg-white md:flex">
        
        {/* BRANDING LOGO */}
        <div className="flex h-24 shrink-0 items-center gap-4 border-b border-slate-100 px-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xl font-black text-white shadow-md">
            P
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-lg font-bold tracking-tight text-slate-900 leading-tight">PDEU Portal</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5 leading-tight">Student Workspace</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 pt-6">
          <DashboardSidebarNav profileId={profileId} />
        </nav>
        
        {/* USER PROFILE & LOGOUT */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-slate-900">{user.name}</span>
                <span className="truncate text-xs text-slate-500 font-medium">Student Account</span>
              </div>
           </div>
           <LogoutButton />
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex min-h-screen flex-col md:ml-[17rem]">
        <main className="flex-1 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}