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
  importStudentsFromCSV
} from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import DepartmentChart from "@/components/DepartmentChart";
import LogoutButton from "@/components/LogoutButton";
import ExportCSVButton from "@/components/ExportCSVButton";
import UserManagementTable from "@/components/UserManagementTable";

export default async function AdminDashboardPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "overview";

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // Fetch all necessary data for the dashboard
  const analytics = await getSystemAnalytics();
  const mentors = await getAllMentors();
  const notices = await getLatestNotices(5);
  const exportData = await getVerifiedStudentsForExport();
  const allProfiles = await getAllProfiles();
  const systemSettings = await getGlobalSettings();
  const deptData = await getDepartmentAnalytics();
  const unassignedStudents = await getUnassignedStudents();

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {/* Main Dashboard Link */}
          <Link 
            href="/admin-dashboard" 
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${!['users', 'settings'].includes(activeTab) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
          >
            System Dashboard
          </Link>
          
          {/* User Management Link */}
          <Link 
            href="?tab=users" 
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
          >
            User Management
          </Link>

          {/* System Settings Link */}
          <Link 
            href="?tab=settings" 
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
          >
            System Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-slate-800 truncate">{user.name || "System Admin"}</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">Coordinator</span>
              </div>
           </div>
           <div className="px-1"><LogoutButton /></div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* DYNAMIC HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'users' ? 'User Management' : activeTab === 'settings' ? 'System Settings' : 'System Dashboard'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'users' 
                ? 'Manage all platform accounts, roles, and access.' 
                : activeTab === 'settings'
                ? 'Configure global variables and system-wide parameters.'
                : 'Manage institutional data and coordinate faculty-student relations.'}
            </p>
          </div>

          {/* ================= 5-PILL NAVIGATION TABS (Hides on Sidebar Tabs) ================= */}
          {!['users', 'settings'].includes(activeTab) && (
            <div className="flex flex-wrap gap-2 bg-slate-200/50 p-1.5 rounded-xl mb-8 border border-slate-200 shadow-sm w-fit">
              <Link href="?tab=overview" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Overview</Link>
              <Link href="?tab=assignments" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'assignments' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Assignments</Link>
              <Link href="?tab=notices" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'notices' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Notices</Link>
              <Link href="?tab=faculty" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'faculty' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Faculty</Link>
              <Link href="?tab=export" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'export' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Data Export</Link>
            </div>
          )}

          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Platform Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-xl">👥</div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Students</p>
                  <p className="text-3xl font-extrabold text-slate-800">{analytics.totalStudents}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4 text-xl">✅</div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Officially Verified</p>
                  <p className="text-3xl font-extrabold text-slate-800">{analytics.verifiedStudents}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-4 text-xl">⏳</div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Verification</p>
                  <p className="text-3xl font-extrabold text-slate-800">{analytics.pendingVerifications}</p>
                  {analytics.pendingVerifications > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-yellow-400"></div>}
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-4 text-xl">🤝</div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Meetings Logged</p>
                  <p className="text-3xl font-extrabold text-slate-800">{analytics.totalMeetings}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Verification by Department</h3>
                  <p className="text-sm text-slate-500">Track onboarding progress across different engineering branches.</p>
                </div>
                <DepartmentChart data={deptData} />
              </div>
            </div>
          )}

         {/* ================= TAB 2: ASSIGNMENTS ================= */}
          {activeTab === 'assignments' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
               
               {/* BULK IMPORT CARD */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Bulk Student Import</h2>
                  <p className="text-sm text-slate-500 mb-6">Upload a CSV file with columns: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">FullName, Email, Department</span></p>
                  <form action={async (formData) => {
                    "use server";
                    await importStudentsFromCSV(formData);
                    redirect("/admin-dashboard?tab=assignments"); // Stay on the assignments tab!
                  }} className="flex items-center gap-4">
                    <input 
                      type="file" 
                      name="file" 
                      accept=".csv"
                      required 
                      className="block w-full max-w-md text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg"
                    />
                    <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 shadow-sm whitespace-nowrap">
                      Upload CSV
                    </button>
                  </form>
                </div>

                {/* PENDING ASSIGNMENTS TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Pending Assignments</h2>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                      {unassignedStudents?.length || 0} Students Pending
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Student Info</th>
                          <th className="px-6 py-4">Department</th>
                          <th className="px-6 py-4">Assign Mentor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        
                        {(!unassignedStudents || unassignedStudents.length === 0) ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">
                              All students have been assigned to mentors! 🎉
                            </td>
                          </tr>
                        ) : (
                          unassignedStudents.map((student: any) => (
                            <tr key={student.$id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800">{student.fullName}</p>
                                <p className="text-xs text-slate-500">{student.email}</p>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-700">{student.department || "N/A"}</td>
                              <td className="px-6 py-4">
                                
                                {/* ==== THE DYNAMIC FORM (FIXED REDIRECT) ==== */}
                                <form action={async (formData) => {
                                  "use server";
                                  await assignMentorToStudent(student.$id, formData);
                                  redirect("/admin-dashboard?tab=assignments"); // Forces it to stay on this tab!
                                }} 
                                className="flex items-center gap-2">
                                  <select 
                                    name="mentorId" 
                                    required
                                    className="w-full max-w-[250px] p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                  >
                                    <option value="">Select a Mentor...</option>
                                    {mentors?.map((mentor: any) => (
                                      <option key={mentor.$id} value={mentor.$id}>
                                        {mentor.fullName} ({mentor.department || "Faculty"})
                                      </option>
                                    ))}
                                  </select>
                                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                                    Assign
                                  </button>
                                </form>

                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          )}

          {/* ================= TAB 3: GLOBAL NOTICES ================= */}
          {activeTab === 'notices' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Broadcast New Notice</h2>
                <form action={async (formData) => { "use server"; await createGlobalNotice(formData); }} className="space-y-4">
                  <input type="text" name="title" placeholder="Notice Title (e.g., Final Marks Submission)" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"/>
                  <textarea name="content" placeholder="Type your broadcast message here..." rows={3} required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">Publish Notice</button>
                </form>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-4">Recent Broadcasts</h3>
                <div className="space-y-3">
                  {notices.map((notice: any) => (
                    <div key={notice.$id} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                      <p className="font-bold text-slate-800">{notice.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{notice.content}</p>
                      <p className="text-xs text-slate-400 mt-2">{new Date(notice.$createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: FACULTY MANAGEMENT ================= */}
          {activeTab === 'faculty' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-800">Active Mentors</h2>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">{mentors.length} Registered</span>
                </div>
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Professor Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">System Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mentors.map((mentor: any) => (
                      <tr key={mentor.$id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">{mentor.fullName}</td>
                        <td className="px-6 py-4">{mentor.department || "Faculty"}</td>
                        <td className="px-6 py-4"><span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md">Mentor</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 5: DATA EXPORT ================= */}
          {activeTab === 'export' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto mt-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📊</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Master Roster Export</h2>
                <p className="text-slate-500 mb-8">Download a standardized CSV file of all officially verified students. This file is formatted for delivery to the University Administration office.</p>
                <div className="flex justify-center">
                  <ExportCSVButton data={exportData} />
                </div>
                <p className="text-xs text-slate-400 mt-4">Contains {exportData.length} verified records.</p>
              </div>
            </div>
          )}

          {/* ================= TAB 6: USER MANAGEMENT (God Mode) ================= */}
          {activeTab === 'users' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <UserManagementTable profiles={allProfiles} />
            </div>
          )}

          {/* ================= TAB 7: SYSTEM SETTINGS ================= */}
          {activeTab === 'settings' && systemSettings && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 max-w-2xl">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">⚙️</div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Global Configuration</h2>
                    <p className="text-sm text-slate-500">Update the current active university term for all users.</p>
                  </div>
                </div>

                <form action={async (formData) => {
                  "use server";
                  await updateGlobalSettings(systemSettings.$id, formData);
                }} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Active Term</label>
                      <input 
                        type="text" 
                        name="activeTerm" 
                        defaultValue={systemSettings.activeTerm || systemSettings.currentSemester} 
                        placeholder="e.g., Odd Semesters (July-Dec)"
                        required 
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Academic Year</label>
                      <input 
                        type="text" 
                        name="academicYear" 
                        defaultValue={systemSettings.academicYear} 
                        placeholder="e.g., 2026-2027"
                        required 
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-100">
                    <strong>Note:</strong> Saving these changes will instantly update the active term display on all student and mentor dashboards system-wide.
                  </div>

                  <button type="submit" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-sm transition-all w-full md:w-auto">
                    Save Global Settings
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}