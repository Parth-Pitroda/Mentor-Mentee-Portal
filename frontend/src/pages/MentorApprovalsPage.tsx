import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getPendingApprovals } from "@/lib/actions/student.actions";
import MentorSidebar from "@/components/MentorSidebar";
import MentorHeader from "@/src/components/MentorHeader";
import ApprovalQueue from "@/src/components/ApprovalQueue";
import LoadingPage from "@/src/components/LoadingPage";
import { emptyApprovals } from "@/src/types/app.types";
import { initials } from "@/src/utils/routing";

export default function MentorApprovalsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "requests";
  const state = useAsyncData(async () => {
    const user = await getLoggedInUser();
    if (!user) return null;
    const pending = await getPendingApprovals(user.$id);
    return { user, pending };
  }, [activeTab]);

  useEffect(() => {
    if (!state.loading && !state.data?.user) navigate("/sign-in", { replace: true });
  }, [navigate, state.data, state.loading]);

  if (state.loading || !state.data) return <LoadingPage label="Loading approval queue..." />;

  const data = state.data as any;
  const pending = data.pending || emptyApprovals;
  const pendingApprovalCount = pending.meetings.length + pending.meetingRequests.length + pending.academics.length + pending.achievements.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <MentorSidebar activeItem="approvals" pendingApprovalCount={pendingApprovalCount} userName={data.user.name} />
      <main className="min-h-screen p-6 md:ml-64 lg:p-10">
        <div className="mx-auto max-w-5xl">
          <MentorHeader title="Pending Approvals" initials={initials(data.user.name)} />
          <div className="mb-8 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1.5 shadow-sm lg:w-fit">
            {[
              ["requests", "Meeting Requests", pending.meetingRequests.length],
              ["academics", "Academics", pending.academics.length],
              ["achievements", "Achievements", pending.achievements.length],
              ["meetings", "Meeting Logs", pending.meetings.length],
            ].map(([key, label, count]) => (
              <Link key={key as string} to={`?tab=${key}`} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${activeTab === key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {label as string} <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">{count as number}</span>
              </Link>
            ))}
          </div>
          <ApprovalQueue activeTab={activeTab} pending={pending} />
        </div>
      </main>
    </div>
  );
}
