import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { Client, Databases, Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(client);

    // Fetch the user's profile to check their role
    const profileRes = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!,
      [Query.equal("email", [user.email.toLowerCase()])]
    );

    const profile = profileRes.documents[0];

    // THE ULTIMATE LOCK: If they are not an admin or coordinator, kick them out immediately!
    if (!profile || (profile.role !== "admin" && profile.role !== "coordinator")) {
      console.warn(`Unauthorized access attempt by ${user.email}`);
      redirect("/sign-in?error=unauthorized"); // Or redirect them to their own dashboard
    }
  } catch (error) {
    console.error("Admin authorization failed:", error);
    redirect("/sign-in");
  }

  // If they pass the check, render the Admin Dashboard
  return <>{children}</>;
}