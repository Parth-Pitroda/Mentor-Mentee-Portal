import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import StudentOnboarding from "@/components/forms/StudentOnboarding";
import { databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";

export default async function Home() {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/sign-in");
  }
  try {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
    const result = await databases.listDocuments(
    DATABASE_ID,
    PROFILES_COLLECTION,
    [Query.equal("email", [user.email.toLowerCase()])]
  );

    if (result.total > 0) {
      redirect(`/dashboard/${result.documents[0].$id}`);
    }
  } catch (error) {
    console.error("Profile check failed:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Welcome, {user.name}
          </h1>
          <p className="text-gray-600 mt-2 text-center">
            Please complete your profile to access the mentor portal.
          </p>
        </div>
        <StudentOnboarding />
      </div>
    </main>
  );
}