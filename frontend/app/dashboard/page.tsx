import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getProfileByEmail } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";

export default async function StudentDashboardPage() {
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfileByEmail(user.email);

  if (!profile) {
    redirect("/onboarding");
  }

  if (profile.role === "admin") {
    redirect("/admin-dashboard");
  }

  if (profile.role === "mentor") {
    redirect("/mentor-dashboard");
  }

  const isProfileComplete =
    profile.department &&
    profile.department !== "Pending Assignment" &&
    profile.department !== "Unassigned";

  if (!isProfileComplete) {
    redirect("/onboarding");
  }

  redirect(`/dashboard/${profile.$id}`);
}
