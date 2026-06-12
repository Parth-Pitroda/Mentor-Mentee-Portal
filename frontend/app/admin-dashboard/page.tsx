import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { 
  getSystemAnalytics, 
  getAllMentors, 
  getLatestNotices, 
  createGlobalNotice,
  getVerifiedStudentsForExport,
  getAllProfiles,
  getGlobalSettings,
  updateGlobalSettings,
  getDepartmentAnalytics,
  getUnassignedStudents,
  assignMentorToStudent,
  getSystemActivityLog
} from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import DepartmentChart from "@/components/DepartmentChart";
import LogoutButton from "@/components/LogoutButton";
import ExportCSVButton from "@/components/ExportCSVButton";
import UserManagementTable from "@/components/UserManagementTable";
import type { UserProfile } from "@/types";

export default async function AdminDashboardPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "overview";

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

// ✅ AFTER: Concurrent Fetching (Lightning Fast!)
  const [
    analytics, 
    mentors, 
    notices, 
    exportData, 
    allProfiles, 
    systemSettings, 
    deptData, 
    unassignedStudents
  ] = await Promise.all([
    getSystemAnalytics(),
    getAllMentors(),
    getLatestNotices(5),
    getVerifiedStudentsForExport(),
    getAllProfiles(),
    getGlobalSettings(),
    getDepartmentAnalytics(),
    getUnassignedStudents()
  ]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-extrabold tracking-tight text-white">PDEU PORTAL</h2>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-1 block">Administrator</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="?tab=overview" className={`block px-4 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            System Overview
          </Link>
          <Link href="?tab=assignments" className={`block px-4 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'assignments' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            Mentor Assignments
          </Link>
          <Link href="?tab=users" className={`block px-4 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            User Database
          </Link>
          <Link href="?tab=settings" className={`block px-4 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            Global Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <LogoutButton />
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-slate-500 mt-1">Manage university data and mentor mappings.</p>
            </div>
            {activeTab === 'users' && (
               <ExportCSVButton data={exportData} filename={`pdeu-verified-students-${new Date().toISOString().split('T')[0]}.csv`} />
            )}
          </div>

          {/* ================= TAB: OVERVIEW ================= */}
          {activeTab === 'overview' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Your existing Analytics Cards & Department Chart code goes here */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-400 uppercase">Total Mentees</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{analytics.totalStudents}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-400 uppercase">Verified</p>
                    <p className="text-3xl font-black text-green-600 mt-2">{analytics.verifiedStudents}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-400 uppercase">Pending</p>
                    <p className="text-3xl font-black text-yellow-600 mt-2">{analytics.pendingVerifications}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-400 uppercase">Total Mentors</p>
                    <p className="text-3xl font-black text-purple-600 mt-2">{mentors.length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Department Distribution</h3>
                   <DepartmentChart data={deptData} />
                </div>
             </div>
          )}

          {/* ================= TAB: ASSIGNMENTS ================= */}
          {activeTab === 'assignments' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
              
              {/* --- NEW BULK IMPORT CARD --- */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100px] z-0"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-6">
                    <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-2xl shadow-sm border border-green-200 shrink-0">
                      🗄️
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Master Advisory List Import</h3>
                      <p className="text-slate-500 text-sm font-medium mt-1">
                        Upload the official university CSV to automatically generate student accounts, create university emails, and assign faculty mentors in one click.
                      </p>
                    </div>
                  </div>

                  <form action={async (formData) => {
                    "use server";
                    const { importMasterAdvisoryList } = await import("@/lib/actions/student.actions");
                    await importMasterAdvisoryList(formData);
                  }} className="flex flex-col md:flex-row items-end gap-4">
                    
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Upload Excel Data (Must be saved as .CSV)</label>
                      <input
                        type="file"
                        name="file"
                        accept=".csv"
                        required
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 transition-colors"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:bg-slate-800 transition-colors h-[48px] flex items-center justify-center whitespace-nowrap"
                    >
                      Run Database Migration
                    </button>
                  </form>

                  <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800 flex gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <span className="font-bold block mb-1">Important Admin Note:</span> 
                      The Excel file (.xlsx) provided by the university <b>must</b> be saved as a <b>CSV (Comma delimited)</b> file before uploading. The system will automatically skip header titles and match students to faculty based on fuzzy name logic.
                    </div>
                  </div>
                </div>
              </div>

              {/* --- EXISTING MANUAL ASSIGNMENT UI --- */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800">Manual Mentee Assignment</h3>
                  <p className="text-slate-500 text-sm mt-1">Assign mentors individually to students missing from the automated roster.</p>
                </div>
                <div className="p-0">
                  {unassignedStudents.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✨</div>
                      <p className="text-slate-600 font-medium">All students have been assigned mentors.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-bold border-b border-slate-200">Student Name</th>
                            <th className="p-4 font-bold border-b border-slate-200">Email</th>
                            <th className="p-4 font-bold border-b border-slate-200">Department</th>
                            <th className="p-4 font-bold border-b border-slate-200">Assign Mentor</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {(unassignedStudents as UserProfile[]).map((student) => (
                            <tr key={student.$id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-bold text-slate-800">{student.fullName}</td>
                              <td className="p-4 text-slate-600">{student.email}</td>
                              <td className="p-4 text-slate-600">{student.department}</td>
                              <td className="p-4">
                                <form action={async (formData) => {
                                  "use server";
                                  const { assignMentorToStudent } = await import("@/lib/actions/student.actions");
                                  await assignMentorToStudent(student.$id, formData);
                                }} className="flex items-center gap-2">
                                  <select name="mentorId" required className="p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 min-w-[200px]">
                                    <option value="">Select Mentor...</option>
                                    {(mentors as UserProfile[]).map((mentor) => (
                                      <option key={mentor.$id} value={mentor.$id}>{mentor.fullName}</option>
                                    ))}
                                  </select>
                                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                                    Assign
                                  </button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB: USERS ================= */}
          {activeTab === 'users' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <UserManagementTable profiles={allProfiles} />
             </div>
          )}

        </div>
      </main>
    </div>
  );
}
