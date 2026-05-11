import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
// Import your existing server actions here...

export default async function AdminDashboardPage() {
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // Keep your existing data fetching here!
  // const pendingStudents = await getUnassignedStudents();
  // const mentors = await getAllMentors();

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* 1. THE UNIFIED SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin-dashboard" className="block px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-700">
            Student Assignment
          </Link>
          {/* You can add more admin links here later (e.g., "Manage Mentors", "System Settings") */}
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

      {/* 2. THE MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Assignment</h1>
            <p className="text-slate-500 mt-1">Review unassigned students and pair them with faculty mentors.</p>
          </div>

          {/* BULK IMPORT CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Bulk Student Import</h2>
            <p className="text-sm text-slate-500 mb-6">Upload a CSV file with columns: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">FullName, Email, Department</span></p>
            
            {/* Wrap your existing import logic in this form structure */}
            <form className="flex items-center gap-4">
              <input 
                type="file" 
                name="file"
                accept=".csv"
                className="block w-full max-w-md text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer border border-slate-200 rounded-lg"
              />
              <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap">
                Upload CSV
              </button>
            </form>
          </div>

          {/* PENDING ASSIGNMENTS TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Pending Assignments</h2>
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                {/* Put your pending count here, e.g., pendingStudents.length */} 
                2 Students Pending
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
                  
                  {/* Map over your pending students here! Below is the polished UI for a single row: */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">Rahul Sharma</p>
                      <p className="text-xs text-slate-500">rahul.s@sot.pdpu.ac.in</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">Mechanical Engineering</td>
                    <td className="px-6 py-4">
                      {/* Your existing assignment form goes here */}
                      <form className="flex items-center gap-2">
                        <select 
                          name="mentorId" 
                          className="w-full max-w-[250px] p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select a Mentor...</option>
                          {/* Map mentors here */}
                          <option value="mentor1">Dr. HirenKumar Thakkar</option>
                        </select>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                          Assign
                        </button>
                      </form>
                    </td>
                  </tr>
                  
                  {/* Add more mapped rows here... */}

                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}