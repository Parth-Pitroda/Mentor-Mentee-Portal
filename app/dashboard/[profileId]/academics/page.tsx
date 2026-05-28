import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getAcademicRecordsForProfile, checkUserRole } from "@/lib/actions/student.actions"; // ✅ Action imported
import { redirect } from "next/navigation";
import AcademicsManager from "@/components/AcademicsManager";

export default async function AcademicsPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const role = await checkUserRole(user.email);
  const isMentor = role === "mentor" || role === "admin" || role === "coordinator";
  
  // ✅ THE DRY FIX: One line to fetch the data instead of 25!
  const academicRecords = await getAcademicRecordsForProfile(profileId) || [];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Document Verification</h2>
        <p className="text-slate-500 mt-1 font-medium">
          Manage and verify university marksheets and performance metrics.
        </p>
      </div>

      <AcademicsManager 
        initialRecords={academicRecords} 
        profileId={profileId} 
        isMentor={isMentor} 
      />
    </div>
  );
}