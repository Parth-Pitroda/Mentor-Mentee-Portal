import { useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getMenteeProfile, getProfileByEmail } from "@/lib/actions/student.actions";
import DashboardSidebarNav from "@/components/DashboardSidebarNav";
import DashboardHeader from "@/components/DashboardHeader";
import LogoutButton from "@/components/LogoutButton";
import LoadingPage from "@/src/components/LoadingPage";
import type { DashboardContext } from "@/src/types/app.types";
import type { UserProfile } from "@/types";

export default function DashboardLayout() {
  const { profileId = "" } = useParams();
  const navigate = useNavigate();
  const state = useAsyncData(async () => {
    const user = await getLoggedInUser();
    if (!user) return null;

    const [currentProfile, targetProfile] = await Promise.all([
      getProfileByEmail(user.email),
      getMenteeProfile(profileId),
    ]);

    return { user, currentProfile, targetProfile };
  }, [profileId]);

  useEffect(() => {
    if (state.loading) return;
    const data = state.data;
    if (!data?.user || !data.currentProfile || !data.targetProfile) {
      navigate("/sign-in", { replace: true });
      return;
    }

    if (data.currentProfile.role === "mentor") {
      navigate(`/mentor-dashboard?tab=student-profile&id=${profileId}`, { replace: true });
      return;
    }

    if (data.targetProfile.email?.toLowerCase() !== data.user.email.toLowerCase()) {
      navigate(`/dashboard/${data.currentProfile.$id}`, { replace: true });
    }
  }, [navigate, profileId, state.data, state.loading]);

  if (state.loading || !state.data?.user || !state.data.targetProfile) return <LoadingPage />;

  const context: DashboardContext = {
    user: state.data.user,
    profileId,
    profile: state.data.targetProfile as UserProfile,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-slate-200 selection:text-slate-900">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col bg-[#1A1A24] text-white md:flex">
        <div className="flex h-24 shrink-0 items-center justify-center border-b border-white/5 px-6">
          <img src="/pdeu_logo.png" alt="PDEU Logo" className="h-14 w-auto object-contain" />
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto py-6 pl-4 pr-0">
          <DashboardSidebarNav profileId={profileId} />
        </nav>
        <div className="border-t border-white/5 p-4">
          <LogoutButton variant="sidebar-dark" />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col md:ml-64">
        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-6xl">
            <DashboardHeader user={{ name: state.data.user.name, email: state.data.user.email }} />
            <Outlet context={context} />
          </div>
        </main>
      </div>
    </div>
  );
}
