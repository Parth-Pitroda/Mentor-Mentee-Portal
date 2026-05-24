import OnboardingWizard from "@/components/OnboardingWizard";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getProfileByEmail } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfileByEmail(user.email);

  if (profile?.role === "admin") {
    redirect("/admin-dashboard");
  }

  if (profile?.role === "mentor") {
    redirect("/mentor-dashboard");
  }

  const isComplete =
    profile?.department &&
    profile.department !== "Pending Assignment" &&
    profile.department !== "Unassigned";

  if (isComplete) {
    redirect(`/dashboard/${profile.$id}`);
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Onboarding</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-blue-950">Welcome to PDEU Portal</h1>
        <p className="mt-2 text-sm text-slate-500">Set up your official mentor-mentee profile.</p>
      </div>
      
      <OnboardingWizard userId={profile?.$id || user.$id} userName={user.name} userEmail={user.email} /> 
      
    </div>
  );
}
