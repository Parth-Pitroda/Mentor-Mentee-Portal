import { getAllStudents, toggleStudentVerification } from "@/lib/actions/student.actions";
import { logoutUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MentorDashboard() {
  const students = await getAllStudents();

  async function handleLogout() {
    "use server";
    await logoutUser();
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentor Control Panel</h1>
            <p className="text-sm text-gray-500">Manage and verify your assigned students.</p>
          </div>
          <form action={handleLogout}>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
              Logout
            </button>
          </form>
        </div>

        {/* Student List Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">Student Directory</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 font-semibold whitespace-nowrap">Student Name</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Roll Details</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Department</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                  <th className="p-4 font-semibold text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                      No students found in the database.
                    </td>
                  </tr>
                ) : (
                  students.map((student: any) => (
                    <tr key={student.$id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-mono">{student.bio}</td>
                      <td className="p-4 text-sm text-gray-600">{student.department}</td>
                      <td className="p-4">
                        {student.isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2 flex justify-end items-center">
                        
                        {/* THE DYNAMIC TOGGLE FORM ACTION */}
                        <form action={toggleStudentVerification.bind(null, student.$id, student.isVerified)}>
                          <button 
                            type="submit" 
                            className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer ${
                              student.isVerified 
                                ? "bg-red-50 text-red-600 hover:bg-red-100" // Red for Revoke
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100" // Blue for Verify
                            }`}
                          >
                            {student.isVerified ? "Revoke" : "Verify"}
                          </button>
                        </form>

                        <Link href={`/dashboard/${student.$id}`} className="text-xs bg-gray-100 text-gray-600 font-semibold px-3 py-1.5 rounded hover:bg-gray-200 transition-colors">
                          View
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
    </div>
  );
}