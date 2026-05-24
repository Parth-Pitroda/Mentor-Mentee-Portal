import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getProfileByEmail } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profileData = await getProfileByEmail(user.email);

  if (!profileData) {
    redirect("/onboarding");
  }

  const role = profileData.role;
  const department = profileData.department;
  const profileId = profileData.$id;

  if (role === "admin") {
    redirect("/admin-dashboard");
  }

  if (role === "mentor") {
    redirect("/mentor-dashboard");
  }

  if (role === "mentee" || role === "student") {
    const isProfileComplete =
      department &&
      department !== "Pending Assignment" &&
      department !== "Unassigned";

    if (!isProfileComplete) {
      redirect("/onboarding");
    }

    redirect(`/dashboard/${profileId}`);
  }

  redirect("/onboarding");
}
