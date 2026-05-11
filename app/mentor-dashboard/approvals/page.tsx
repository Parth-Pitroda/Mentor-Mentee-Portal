import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { 
  getPendingApprovals, 
  updateMeetingStatus, 
  updateAcademicStatus, 
  updateAchievementStatus 
} from "@/lib/actions/student.actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

// 1. Next.js 15 passes searchParams as a Promise to read URL queries!
export default async function MentorApprovalsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "academics"; // Defaults to academics if no tab is clicked

  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const pendingData = await getPendingApprovals(user.$id);
  const { meetings, academics, achievements } = pendingData;

  const getFileUrl = (fileId: string) => {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* SIDEBAR FOR MENTOR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">PDEU PORTAL</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/mentor-dashboard" className="block px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700">
            Mentee Roster
          </Link>
          <Link href="/mentor-dashboard/approvals" className="block px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-700">
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
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
            <p className="text-slate-500 mt-1">Review and verify requests submitted by your mentees.</p>
          </div>

          {/* ================= BEAUTIFUL PILL TABS ================= */}
          <div className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-xl mb-8 w-fit border border-slate-200 shadow-sm">
            <Link 
              href="?tab=academics" 
              className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'academics' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Academics
              <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === 'academics' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                {academics.length}
              </span>
            </Link>
            
            <Link 
              href="?tab=achievements" 
              className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'achievements' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Achievements
              <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === 'achievements' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
                {achievements.length}
              </span>
            </Link>

            <Link 
              href="?tab=meetings" 
              className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'meetings' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Meeting Logs
              <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === 'meetings' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-500'}`}>
                {meetings.length}
              </span>
            </Link>
          </div>

          {/* ================= TAB CONTENT RENDERER ================= */}
          
          {/* ACADEMICS TAB */}
          {activeTab === 'academics' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {academics.length === 0 ? <p className="text-slate-500 italic p-4 bg-white rounded-xl border border-slate-200 text-center">No pending academic records to review.</p> : academics.map((acad: any) => (
                <div key={acad.$id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    {/* Fixed the naked number issue here! */}
                    <h3 className="font-bold text-slate-800 text-lg">
                      {String(acad.semester).toLowerCase().includes('semester') ? acad.semester : `Semester ${acad.semester}`}
                    </h3>
                    <p className="text-sm text-slate-500">Student: <span className="font-bold text-slate-700">{acad.studentName}</span></p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm font-medium bg-slate-100 px-2.5 py-1 rounded-md">CPI: <span className="text-blue-600 font-bold">{acad.cpi}</span></span>
                      <span className="text-sm font-medium bg-slate-100 px-2.5 py-1 rounded-md">SPI: <span className="text-blue-600 font-bold">{acad.spi}</span></span>
                    </div>
                    {acad.fileId && (
                      <a href={getFileUrl(acad.fileId)} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-bold mt-3 flex items-center gap-1 hover:underline w-fit">
                        📄 View Attached Marksheet
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 min-w-max">
                    <form action={async () => { "use server"; await updateAcademicStatus(acad.$id, "Verified", acad.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all">Verify</button>
                    </form>
                    <form action={async () => { "use server"; await updateAcademicStatus(acad.$id, "Rejected", acad.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition-all">Reject</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {achievements.length === 0 ? <p className="text-slate-500 italic p-4 bg-white rounded-xl border border-slate-200 text-center">No pending extracurricular achievements to review.</p> : achievements.map((ach: any) => (
                <div key={ach.$id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{ach.title} <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md ml-2">{ach.category}</span></h3>
                    <p className="text-sm text-slate-500 mt-1">Student: <span className="font-bold text-slate-700">{ach.studentName}</span></p>
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">{ach.description}</p>
                    {ach.fileId && (
                      <a href={getFileUrl(ach.fileId)} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-bold mt-3 flex items-center gap-1 hover:underline w-fit">
                        🏆 View Certificate/Proof
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 min-w-max items-start">
                    <form action={async () => { "use server"; await updateAchievementStatus(ach.$id, "Verified", ach.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all">Verify</button>
                    </form>
                    <form action={async () => { "use server"; await updateAchievementStatus(ach.$id, "Rejected", ach.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition-all">Reject</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MEETINGS TAB */}
          {activeTab === 'meetings' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {meetings.length === 0 ? <p className="text-slate-500 italic p-4 bg-white rounded-xl border border-slate-200 text-center">No pending meeting logs to review.</p> : meetings.map((meeting: any) => (
                <div key={meeting.$id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{meeting.topic}</h3>
                    <p className="text-sm text-slate-500 mt-1">Student: <span className="font-bold text-slate-700">{meeting.studentName}</span> | Date: {new Date(meeting.date).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">"{meeting.description}"</p>
                  </div>
                  <div className="flex gap-2 min-w-max">
                    <form action={async () => { "use server"; await updateMeetingStatus(meeting.$id, "Verified", meeting.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all">Verify</button>
                    </form>
                    <form action={async () => { "use server"; await updateMeetingStatus(meeting.$id, "Rejected", meeting.studentId); }}>
                      <button type="submit" className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition-all">Reject</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}