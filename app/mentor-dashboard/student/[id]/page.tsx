import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getStudentProfile, toggleStudentVerification } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function MentorStudentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const studentId = params.id;

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // 1. Fetch the data
  const studentData = await getStudentProfile(studentId);
  if (!studentData || !studentData.profile) return <div className="p-12 text-center text-slate-500 font-bold">Student not found.</div>;

  // 2. THE FIX: Extract the actual profile object!
  const student = studentData.profile;

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* SIDEBAR FOR MENTOR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/mentor-dashboard" className="block px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-700">
            &larr; Back to Roster
          </Link>
          <Link href="/mentor-dashboard/approvals" className="block px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700">
            Pending Approvals
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="px-1"><LogoutButton /></div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* HEADER BANNER */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{student.fullName}</h1>
                {student.isVerified ? (
                  <span className="bg-green-100 text-green-700 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-green-200">Officially Verified</span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-yellow-200">Pending Setup</span>
                )}
              </div>
              <p className="text-slate-500 font-medium">Roll No: <span className="text-slate-800 font-bold">{student.rollNo || "Not Set"}</span> • {student.department}</p>
              <p className="text-slate-500 text-sm mt-1">{student.email}</p>
            </div>

            {/* THE MASTER VERIFICATION BUTTON */}
            <form action={async () => {
              "use server";
              await toggleStudentVerification(student.$id, student.isVerified);
            }}>
              <button 
                type="submit" 
                className={`px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 ${
                  student.isVerified 
                  ? "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-red-600" 
                  : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                }`}
              >
                {student.isVerified ? "Revoke Verification" : "✓ Mark as Verified"}
              </button>
            </form>
          </div>

          {/* QUICK STATS */}
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Profile Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Semester</p>
              <p className="text-2xl font-extrabold text-slate-800">{student.currentSemester || "N/A"}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <p className="text-2xl font-extrabold text-slate-800">{student.isVerified ? "Locked" : "Reviewing"}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Skill</p>
              <p className="text-lg font-bold text-slate-800 truncate">{student.skills?.[0] || "None listed"}</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}