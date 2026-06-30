import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getMenteeProfile, getProfileByEmail } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import DashboardSidebarNav from "@/components/DashboardSidebarNav";
import DashboardHeader from "@/components/DashboardHeader";

type DashboardProfile = {
  $id: string;
  email?: string;
  role?: string;
  mentorId?: string;
  fullName?: string;
  isVerified?: boolean;
  rollNo?: string;
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-slate-200 selection:text-slate-900">
      
      {/* ================= FULL-HEIGHT SIDEBAR ================= */}
      <aside className="fixed top-0 left-0 z-20 hidden h-screen w-64 flex-col bg-[#1A1A24] text-white md:flex animate-in fade-in duration-300">
        
        {/* BRANDING LOGO */}
        <div className="flex h-24 shrink-0 items-center justify-center border-b border-white/5 px-6">
          <img src="/pdeu_logo.png" alt="PDEU Logo" className="h-14 w-auto object-contain" />
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-6 pl-4 pr-0 space-y-1.5">
          <DashboardSidebarNav profileId={profileId} />
        </nav>
        
        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-white/5 bg-transparent">
           <LogoutButton variant="sidebar-dark" />
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex min-h-screen flex-col md:ml-64">
        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <DashboardHeader 
              profileId={profileId}
              user={{ 
                name: currentProfile?.fullName || user.name, 
                email: user.email, 
                rollNo: currentProfile?.rollNo 
              }} 
            />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}