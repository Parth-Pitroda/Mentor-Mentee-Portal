import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getMenteeProfile, getProfileByEmail } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import DashboardSidebarNav from "@/components/DashboardSidebarNav";
import PortalTopNavbar from "@/components/PortalTopNavbar";


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

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalTopNavbar userName={user.name || "User"} userEmail={user.email} />

      <aside className="fixed top-16 z-20 hidden h-[calc(100vh-4rem)] w-[17rem] flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-100 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Workspace</p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          <DashboardSidebarNav profileId={profileId} />
        
        </nav>
        
        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800 truncate">{user.name}</span>
                <span className="block text-xs text-slate-500 truncate">{user.email}</span>
              </div>
           </div>
           <LogoutButton />
        </div>
      </aside>
      <div className="flex min-h-screen flex-col pt-16 md:ml-[17rem]">
        <main className="min-h-screen flex-1 bg-slate-50 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    
  );
}
