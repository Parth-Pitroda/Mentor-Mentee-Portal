export const dynamic = "force-dynamic";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getLatestNotices, getMentorRoster, getMenteeProfile } from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import MenteeCard from "@/components/MenteeCard";
import NotificationBell from "@/components/NotificationBell";

export default async function MentorDashboardPage(props: { searchParams: Promise<{ tab?: string, id?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "roster";
  const studentId = searchParams.id;

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  // Fetch data specific to this mentor
  const myMentees = await getMentorRoster(user.$id);
  const notices = await getLatestNotices(5);

  // Fetch specific student data if the mentor is viewing a profile OR logging a meeting
  let selectedStudent = null;
  if ((activeTab === 'student-profile' || activeTab === 'log-meeting') && studentId) {
    selectedStudent = await getMenteeProfile(studentId);
  }

  // Dynamic Header Logic
  let pageTitle = "Mentee Roster";
  let pageDesc = "Manage your assigned students and track their progress.";
  if (activeTab === 'notices') {
    pageTitle = "University Notices";
    pageDesc = "Important updates and deadlines from the administration.";
  } else if (activeTab === 'student-profile' && selectedStudent) {
    pageTitle = "Student Dossier";
    pageDesc = `Detailed academic and personal profile for ${selectedStudent.fullName}.`;
  } else if (activeTab === 'log-meeting' && selectedStudent) {
    pageTitle = "Log Mentorship Session";
    pageDesc = `Record a new meeting with ${selectedStudent.fullName}.`;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">Faculty Dashboard</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="?tab=roster" 
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'roster' || activeTab === 'student-profile' || activeTab === 'log-meeting' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
          >
            My Mentees
          </Link>
          <Link 
            href="?tab=notices" 
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'notices' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
          >
            Global Notices
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-purple-200">
                {user.name ? user.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-slate-800 truncate">{user.name || "Faculty Member"}</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">Mentor</span>
              </div>
           </div>
           <div className="px-1"><LogoutButton /></div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* DYNAMIC HEADER & NOTIFICATIONS */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              {/* Show 'Back to Roster' ONLY on the profile page */}
              {activeTab === 'student-profile' && (
                <Link href="?tab=roster" className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 transition-colors">
                  ← Back to Roster
                </Link>
              )}
              {/* Show 'Back to Dossier' ONLY on the log meeting page */}
              {activeTab === 'log-meeting' && selectedStudent && (
                <Link href={`?tab=student-profile&id=${selectedStudent.$id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 transition-colors">
                  ← Back to Dossier
                </Link>
              )}
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-slate-500 mt-1">
                {pageDesc}
              </p>
            </div>
            
            <div className="mt-1">
              <NotificationBell hasUnread={notices && notices.length > 0} />
            </div>
          </div>

          {/* ================= TAB 1: MENTEE ROSTER ================= */}
          {activeTab === 'roster' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {(!myMentees || myMentees.length === 0) ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎓</div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No students assigned</h3>
                  <p className="text-slate-500 font-medium">The administration has not assigned any mentees to your roster yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myMentees.map((mentee: any) => (
                    <MenteeCard key={mentee.$id} student={mentee} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: GLOBAL NOTICES ================= */}
          {activeTab === 'notices' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-800">Recent Broadcasts</h2>
                </div>
                <div className="p-6">
                  {(!notices || notices.length === 0) ? (
                    <p className="text-center text-slate-500 py-8">No notices have been published yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {notices.map((notice: any) => (
                        <div key={notice.$id} className="p-5 border border-slate-200 rounded-xl hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">📢</span>
                            <h3 className="font-bold text-slate-800 text-lg">{notice.title}</h3>
                          </div>
                          <p className="text-slate-600 ml-11 mb-3">{notice.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: STUDENT PROFILE DOSSIER ================= */}
          {activeTab === 'student-profile' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm border border-blue-100 overflow-hidden shrink-0">
                      {selectedStudent.profilePictureId ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${selectedStudent.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                          alt={`${selectedStudent.fullName} Profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedStudent.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.fullName}</h2>
                      <p className="text-slate-500 font-medium">{selectedStudent.email}</p>
                      <div className="flex gap-2 mt-2">
                         <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200">
                           {selectedStudent.department || "N/A"}
                         </span>
                         <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold border border-green-200">
                           Verified Student
                         </span>
                      </div>
                    </div>
                 </div>
                 
                 <Link 
                    href={`?tab=log-meeting&id=${selectedStudent.$id}`}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
                 >
                    Log New Meeting
                 </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                      📚 Academic Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Roll Number</p>
                         <p className="font-semibold text-slate-800">{selectedStudent.rollNo || "Not Provided"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Semester</p>
                         <p className="font-semibold text-slate-800">Semester {selectedStudent.semester || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current CGPA</p>
                         <p className="font-semibold text-slate-800 text-lg">{selectedStudent.cgpa || "N/A"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Backlogs</p>
                         <p className={`font-semibold text-lg ${Number(selectedStudent.backlogs) > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                           {selectedStudent.backlogs || "0"}
                         </p>
                       </div>
                       <div className="col-span-2">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Technical Interests</p>
                         <p className="font-semibold text-slate-800">{selectedStudent.interests || "None listed."}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                      🏥 Logistics
                    </h3>
                    <div className="space-y-4">
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Group</p>
                         <div className="inline-flex items-center justify-center px-3 py-1 bg-red-50 text-red-700 font-bold rounded-lg border border-red-100">
                           {selectedStudent.bloodGroup || "Unknown"}
                         </div>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Housing Status</p>
                         <p className="font-semibold text-slate-800">{selectedStudent.residentialStatus || "Day Scholar"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Phone</p>
                         <p className="font-semibold text-slate-800">{selectedStudent.phone || "N/A"}</p>
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                      👨‍👩‍👦 Emergency & Guardian Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Father's Details</h4>
                          <div className="space-y-2">
                             <p className="text-sm"><span className="font-semibold text-slate-600">Name:</span> {selectedStudent.fatherName || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Phone:</span> {selectedStudent.fatherPhone || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Email:</span> {selectedStudent.fatherEmail || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Occupation:</span> {selectedStudent.fatherOccupation || "N/A"}</p>
                          </div>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Mother's Details</h4>
                          <div className="space-y-2">
                             <p className="text-sm"><span className="font-semibold text-slate-600">Name:</span> {selectedStudent.motherName || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Phone:</span> {selectedStudent.motherPhone || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Email:</span> {selectedStudent.motherEmail || "N/A"}</p>
                             <p className="text-sm"><span className="font-semibold text-slate-600">Occupation:</span> {selectedStudent.motherOccupation || "N/A"}</p>
                          </div>
                       </div>
                    </div>
                 </div>

              </div>
            </div>
          )}

          {/* ================= TAB 4: LOG NEW MEETING ================= */}
          {activeTab === 'log-meeting' && selectedStudent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl">
            
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl shadow-sm border border-blue-100">
                    📝
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">New Session Record</h3>
                    <p className="text-slate-500 text-sm font-medium">Student: {selectedStudent.fullName}</p>
                  </div>
                </div>

                <form action={async (formData) => {
                  "use server";
                  const { logMeeting } = await import("@/lib/actions/student.actions");
                  
                  await logMeeting({
                    studentId: selectedStudent.$id,
                    date: formData.get("date") as string,
                    topic: formData.get("topic") as string,
                    mentorName: user.name || "Faculty Mentor",
                    description: formData.get("description") as string,
                  });
                  
                  redirect(`?tab=student-profile&id=${selectedStudent.$id}`);
                }} className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Meeting Date</label>
                      <input type="date" name="date" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Discussion Topic</label>
                      <select name="topic" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Select a topic...</option>
                        <option value="Academic Guidance">Academic Guidance</option>
                        <option value="Project/Internship">Project & Internships</option>
                        <option value="Career Counseling">Career Counseling</option>
                        <option value="General Check-in">General Check-in</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Session Notes & Action Items</label>
                    <textarea 
                      name="description" 
                      required 
                      rows={5} 
                      placeholder="Discussed strategies for improving CGPA in the upcoming mid-semesters. Advised the student to focus on core algorithms..."
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors">
                      Save Meeting Record
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}