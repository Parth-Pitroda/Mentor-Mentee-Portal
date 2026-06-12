import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getProfileByEmail } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  try {
    const profile = await getProfileByEmail(user.email);

    if (!profile || (profile.role !== "admin" && profile.role !== "coordinator")) {
      console.warn(`Unauthorized access attempt by ${user.email}`);
      redirect("/sign-in?error=unauthorized");
    }
  } catch (error) {
    console.error("Admin authorization failed:", error);
    redirect("/sign-in");
  }

  return <>{children}</>;
}
