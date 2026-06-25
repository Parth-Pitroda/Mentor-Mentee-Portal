"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { respondToMeetingRequest } from "@/lib/actions/student.actions";
import MentorMeetingScheduler from "./MentorMeetingScheduler";
import MentorScheduledMeetings from "./MentorScheduledMeetings";
import { Calendar, PlusCircle, Inbox, Check, X, Loader2 } from "lucide-react";

type MeetingsTabClientProps = {
  mentees: any[];
  scheduledMeetings: any[];
  meetingRequests: any[];
};

export default function MeetingsTabClient({ mentees, scheduledMeetings, meetingRequests }: MeetingsTabClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingGroupId = searchParams.get("meetingGroupId");

  const [activeSubTab, setActiveSubTab] = useState<"logs" | "schedule" | "requests">(
    meetingGroupId ? "logs" : (meetingRequests && meetingRequests.length > 0 ? "requests" : "logs")
  );

  useEffect(() => {
    if (meetingGroupId) {
      setActiveSubTab("logs");
    }
  }, [meetingGroupId]);

  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleResponse = async (requestId: string, status: "Confirmed" | "Rejected") => {
    setProcessingId(requestId);
    startTransition(async () => {
      try {
        await respondToMeetingRequest(requestId, status);
        router.refresh();
      } catch (error) {
        console.error("Failed to respond to meeting request", error);
      } finally {
        setProcessingId(null);
      }
    });
  };

  const requestsCount = meetingRequests?.length || 0;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Clean Tab Bar with Underline Only on Active Tab Text */}
      <div className="flex w-full gap-8 pb-2 overflow-x-auto scrollbar-hide select-none">
        <button
          onClick={() => setActiveSubTab("logs")}
          className={`flex items-center gap-2 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeSubTab === "logs"
              ? "text-blue-600"
              : "text-slate-450 hover:text-slate-750"
          }`}
        >
          <span className={`pb-1 border-b-2 ${
            activeSubTab === "logs" ? "border-blue-600" : "border-transparent"
          }`}>
            Meeting Logs
          </span>
          <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold ${
            activeSubTab === "logs" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-100 text-slate-500"
          }`}>
            {scheduledMeetings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("schedule")}
          className={`flex items-center gap-2 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
            activeSubTab === "schedule"
              ? "text-blue-600"
              : "text-slate-450 hover:text-slate-750"
          }`}
        >
          <span className={`pb-1 border-b-2 ${
            activeSubTab === "schedule" ? "border-blue-600" : "border-transparent"
          }`}>
            Schedule Session
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("requests")}
          className={`flex items-center gap-2 py-2 text-sm font-bold transition-all duration-200 relative cursor-pointer ${
            activeSubTab === "requests"
              ? "text-blue-600"
              : "text-slate-450 hover:text-slate-750"
          }`}
        >
          <span className={`pb-1 border-b-2 ${
            activeSubTab === "requests" ? "border-blue-600" : "border-transparent"
          }`}>
            Student Requests
          </span>
          {requestsCount > 0 ? (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {requestsCount}
            </span>
          ) : (
            <span className="text-[10px] py-0.5 px-2 rounded-full font-bold bg-slate-100 text-slate-500">
              0
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-w-0 transition-all duration-300">
        
        {/* MEETING LOGS PANEL */}
        {activeSubTab === "logs" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MentorScheduledMeetings meetings={scheduledMeetings} />
          </div>
        )}

        {/* SCHEDULE SESSION PANEL */}
        {activeSubTab === "schedule" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MentorMeetingScheduler mentees={mentees} />
          </div>
        )}

        {/* STUDENT REQUESTS PANEL */}
        {activeSubTab === "requests" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {requestsCount === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center select-none shadow-sm max-w-xl mx-auto my-8 animate-in fade-in duration-300">
                <Inbox className="w-12 h-12 text-slate-350 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-850">No meeting requests</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Your mentees haven't submitted any meeting requests. When a student requests a session, it will appear here for your approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Pending Approvals Queue</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {meetingRequests.map((request: any) => {
                    const isProcessing = processingId === request.$id;
                    return (
                      <div
                        key={request.$id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between gap-5 relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white text-xs font-black shadow-sm">
                                {(request.studentName || "Student").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">{request.studentName || "A mentee"}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Proposed Slot</p>
                              </div>
                            </div>
                            <span className="rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 select-none">
                              {request.proposedDate || request.date
                                ? new Date(request.proposedDate || request.date || "").toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                              {request.proposedTime ? ` @ ${request.proposedTime}` : ""}
                            </span>
                          </div>

                          <div className="bg-slate-50 border border-slate-100/85 rounded-xl p-4 space-y-1">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Agenda & Notes</span>
                            <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                              {request.agenda || request.description || "No agenda specified."}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleResponse(request.$id, "Confirmed")}
                            disabled={isPending || isProcessing}
                            className="flex items-center gap-1.5 px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            {isProcessing && processingId === request.$id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleResponse(request.$id, "Rejected")}
                            disabled={isPending || isProcessing}
                            className="flex items-center gap-1.5 px-4.5 py-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            <X className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
