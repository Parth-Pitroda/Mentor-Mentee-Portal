import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getAchievementRecordsForProfile, checkUserRole } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import AchievementsManager from "@/components/AchievementsManager";

export default async function AchievementsPage({ 
  params 
}: { 
  params: Promise<{ profileId: string }> 
}) {
  const { profileId } = await params;
  
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // ✅ Securely check the role using our new helper
  const role = await checkUserRole(user.email);
  const isMentor = role === "mentor" || role === "admin" || role === "coordinator";

  // ✅ THE DRY FIX: One line to fetch the data instead of 25!
  const achievements = await getAchievementRecordsForProfile(profileId) || [];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Extra-Curricular Achievements</h2>
      </div>

      <AchievementsManager 
        initialRecords={achievements} 
        profileId={profileId} 
        isMentor={isMentor} 
      />
    </div>
  );
}