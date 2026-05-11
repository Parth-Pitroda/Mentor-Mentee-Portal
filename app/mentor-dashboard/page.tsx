import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getAssignedMentees } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function MentorDashboardPage() {
  // 1. Verify the user is logged in
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // 2. Fetch their assigned mentees using their User ID
  const roster = await getAssignedMentees(user.$id);

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* SIDEBAR FOR MENTOR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {/* Active State for Roster Tab */}
          <Link href="/mentor-dashboard" className="block px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-700">
            Mentee Roster
          </Link>
          {/* Inactive State for Approvals Tab */}
          <Link href="/mentor-dashboard/approvals" className="block px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700">
            Pending Approvals
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-9 h-9 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-slate-800 truncate">{user.name}</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">Faculty Mentor</span>
              </div>
           </div>
           <div className="px-1"><LogoutButton /></div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mentee Roster</h1>
            <p className="text-slate-500 mt-1">Manage and track your assigned students for this semester.</p>
          </div>

          {/* THE DATA TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Roll Number</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No students have been assigned to you yet.
                      </td>
                    </tr>
                  ) : (
                    roster.map((student: any) => (
                      <tr key={student.$id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{student.fullName}</td>
                        <td className="px-6 py-4">{student.rollNo || "N/A"}</td>
                        <td className="px-6 py-4">{student.department}</td>
                        <td className="px-6 py-4">
                          {student.isVerified ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                              Pending Setup
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {/* Updated link to point to the Master Verification page! */}
                          <Link 
                            href={`/mentor-dashboard/student/${student.$id}`}
                            className="text-blue-600 font-bold hover:text-blue-800 hover:underline"
                          >
                            View Profile &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}