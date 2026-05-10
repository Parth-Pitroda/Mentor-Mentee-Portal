import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { Client, Databases, Query } from "node-appwrite";
import AssignmentManager from "@/components/AssignmentManager";
import BulkImportManager from "@/components/BulkImportManager";

export default async function AdminDashboardPage() {
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  let unassignedStudents = [];
  let availableMentors = [];

  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.NEXT_APPWRITE_KEY!);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;

    // 1. Ensure the user is actually an Admin (Optional security check)
    const currentUserRes = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION, [
      Query.equal("email", [user.email.toLowerCase()])
    ]);
    
    const role = currentUserRes.documents[0]?.role;
    // For this test, we'll let mentors or admins view it, but you can strictly enforce "admin" later.
    if (role !== "admin" && role !== "coordinator") {
        // redirect("/sign-in"); // Uncomment this in production to lock the page!
    }

    // 2. Fetch all Mentees who DO NOT have a mentor assigned
    const studentsRes = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION, [
      Query.equal("role", "mentee"),
      Query.isNull("mentorId") // Only grab students without a mentor
    ]);
    unassignedStudents = JSON.parse(JSON.stringify(studentsRes.documents));

    // 3. Fetch all Mentors to populate the dropdown
    const mentorsRes = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION, [
      Query.equal("role", "mentor")
    ]);
    availableMentors = JSON.parse(JSON.stringify(mentorsRes.documents));

  } catch (error) {
    console.error("Admin fetch failed:", error);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Simple Top Navigation */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h1 className="text-xl font-bold text-blue-900 tracking-tight">PDEU Coordinator Portal</h1>
          <form action="/sign-in" method="GET">
             <button className="text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">Sign Out</button>
          </form>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">Student Assignment</h2>
          <p className="text-slate-500 mt-1 font-medium">Review unassigned students and pair them with faculty mentors.</p>
        </div>

        <BulkImportManager />
        <AssignmentManager 
          unassignedStudents={unassignedStudents} 
          availableMentors={availableMentors} 
        />
      </div>
    </div>
  );
}