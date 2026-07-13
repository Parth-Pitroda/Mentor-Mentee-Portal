import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getDashboardOverview } from "@/lib/actions/student.actions";
import LoadingPage from "@/src/components/LoadingPage";
import ErrorPanel from "@/src/components/ErrorPanel";
import type { DashboardContext } from "@/src/types/app.types";

export default function MentorProfilePage() {
  const { profileId } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => getDashboardOverview(profileId), [profileId]);
  const overview = state.data as any;

  if (state.loading) return <LoadingPage label="Loading mentor profile..." />;
  if (!overview) return <ErrorPanel message="Information could not be loaded." />;

  const mentor = overview.mentor;

  if (!mentor) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h4 className="text-lg font-bold text-slate-800 mb-1">No Primary Mentor Assigned</h4>
        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">Once the coordinator assigns you a primary faculty mentor, their details will display here.</p>
      </div>
    );
  }

  // Get initials for the mentor
  const mentorInitials = mentor.fullName
    ? mentor.fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "M";

  return (
    <div className="w-full animate-in fade-in duration-500 select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        
        {/* LEFT COLUMN: Initials box & Name */}
        <div className="md:col-span-1 flex flex-col items-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white text-3xl font-black shadow-md mb-5">
            {mentorInitials}
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-1">{mentor.fullName}</h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold uppercase text-[9px] tracking-wider">
            Primary Mentor
          </span>
        </div>

        {/* RIGHT COLUMN: Mentor Details List */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-5 border-b border-slate-200 pb-2">Faculty Mentor Details</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/85 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Full Name</span>
                <span className="text-slate-900 font-extrabold">{mentor.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/85 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Email Address</span>
                <span className="text-slate-900 font-extrabold">{mentor.email || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/85 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">System Role</span>
                <span className="text-slate-900 font-extrabold capitalize">{mentor.role || "Mentor"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/85 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Department / Area</span>
                <span className="text-slate-900 font-extrabold">{mentor.department || "Faculty of Technology"}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
