import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getPendingApprovals } from "@/lib/actions/student.actions";
import { updateMeetingStatus } from "@/lib/actions/student.actions"; // The action you already wrote!
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function MentorApprovalsPage() {
  const user = await getLoggedInUser();
  if (!user) redirect("/sign-in");

  const pendingData = await getPendingApprovals(user.$id);
  const pendingMeetings = pendingData.meetings;

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
          {/* Active State for Approvals Tab */}
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

          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            Meeting Logs
            <span className="bg-orange-100 text-orange-700 text-xs py-0.5 px-2 rounded-full">
              {pendingMeetings.length} Pending
            </span>
          </h2>

          <div className="space-y-4">
            {pendingMeetings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                <p className="text-slate-500 font-medium">You're all caught up! No pending meetings.</p>
              </div>
            ) : (
              pendingMeetings.map((meeting: any) => (
                <div key={meeting.$id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Meeting Details */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{meeting.topic}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Submitted by: <span className="font-bold text-slate-700">{meeting.studentName}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Date: {new Date(meeting.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      "{meeting.description}"
                    </p>
                  </div>

                  {/* Verification Actions (Server Actions via Forms) */}
                  <div className="flex gap-2 min-w-max">
                    <form action={async () => {
                      "use server";
                      await updateMeetingStatus(meeting.$id, "Verified", meeting.studentId);
                    }}>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                        Verify
                      </button>
                    </form>

                    <form action={async () => {
                      "use server";
                      await updateMeetingStatus(meeting.$id, "Rejected", meeting.studentId);
                    }}>
                      <button type="submit" className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors">
                        Reject
                      </button>
                    </form>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
}