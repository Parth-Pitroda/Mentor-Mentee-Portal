import OnboardingWizard from "@/components/OnboardingWizard";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  // Get the user from your auth actions
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Welcome to PDEU Portal</h1>
        <p className="mt-2 text-slate-500">Let's set up your official student profile.</p>
      </div>
      
      {/* Pass the ID into the component */}
      <OnboardingWizard userId={user.$id} /> 
      
    </div>
  );
}