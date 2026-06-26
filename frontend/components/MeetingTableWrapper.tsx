"use client";

import { useState } from "react";
import { updateMeetingStatus } from "@/lib/actions/student.actions";
import { useRouter } from "next/navigation";
import type { Meeting } from "@/types";
import { AlertCircle, Calendar, Check, ChevronRight, Clock, Inbox, Link as LinkIcon, X } from "lucide-react";

type MeetingLog = Meeting & {
  $id: string;
  topic: string;
  status: string;
  mentorName?: string;
  proposedTime?: string;
};

type MeetingTableWrapperProps = {
  initialMeetings: MeetingLog[];
  profileId: string;
  isMentor?: boolean;
};

export default function MeetingTableWrapper({ initialMeetings, profileId, isMentor = false }: MeetingTableWrapperProps) {
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<MeetingLog | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle Mentor Verification Actions
  const handleStatusUpdate = async (status: "Verified" | "Rejected") => {
    if (!selectedLog) return;
    setIsUpdating(true);
    await updateMeetingStatus(selectedLog.$id, status, profileId);
    setIsUpdating(false);
    setSelectedLog(null);
    router.refresh();
  };

  const getStatusLabel = (status: string) => {
    if (status === "Verified") return "Verified";
    if (status === "Pending") return "Not Verified";
    return status || "Not Verified";
  };

  const getStatusClass = (status: string) => {
    if (status === "Verified" || status === "Confirmed") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }

    if (status === "Rejected") {
      return "bg-rose-50 text-rose-700 border-rose-100";
    }

    if (status === "Requested") {
      return "bg-blue-50 text-blue-700 border-blue-100";
    }

    if (status === "Scheduled") {
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }

    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  const getStatusIcon = (status: string) => {
    if (status === "Verified" || status === "Confirmed") {
      return <Check className="h-3.5 w-3.5" />;
    }

    if (status === "Rejected") {
      return <X className="h-3.5 w-3.5" />;
    }

    return <AlertCircle className="h-3.5 w-3.5" />;
  };

  const getMeetingDetails = (meeting: MeetingLog) => {
    const description = meeting.description || "";
    const lines = description.split("\n");
    const time = meeting.scheduledTime || meeting.proposedTime || lines.find((line: string) => line.startsWith("Time:"))?.replace("Time:", "").trim() || "";
    const mode = meeting.meetingMode || lines.find((line: string) => line.startsWith("Mode:"))?.replace("Mode:", "").trim() || "";
    const link = meeting.meetingLink || lines.find((line: string) => line.startsWith("Link:"))?.replace("Link:", "").trim() || "";
    const venue = lines.find((line: string) => line.startsWith("Venue:"))?.replace("Venue:", "").trim() || "";
    const agendaIndex = lines.findIndex((line: string) => line.trim() === "Agenda:");
    const agenda = meeting.agenda || (agendaIndex >= 0 ? lines.slice(agendaIndex + 1).join("\n").trim() : description);

    return { time, mode, link, venue, agenda };
  };

  const formatDate = (date?: string) => {
    if (!date) return "Pending Date";

    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="space-y-4">
        {initialMeetings.length === 0 ? (
          <div className="mx-auto my-8 max-w-xl rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <Inbox className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-base font-bold text-slate-850">No meeting logs found.</h3>
          </div>
        ) : (
          <div className="overflow-x-auto select-none rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4 font-extrabold">Meeting Topic</th>
                  <th className="px-6 py-4 font-extrabold">Date & Time</th>
                  <th className="px-6 py-4 font-extrabold">Venue / Mode</th>
                  <th className="px-6 py-4 font-extrabold">Status</th>
                  <th className="px-6 py-4 text-right font-extrabold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialMeetings.map((log) => {
                  const details = getMeetingDetails(log);

                  return (
                    <tr
                      key={log.$id}
                      onClick={() => setSelectedLog(log)}
                      className="group/row cursor-pointer text-sm text-slate-655 transition-colors duration-200 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold leading-tight text-slate-900 transition-colors group-hover/row:text-blue-700">
                          {log.topic || "Meeting Log"}
                        </p>
                        <p className="mt-1 max-w-xs truncate text-xs font-semibold text-slate-400 md:max-w-md">
                          {log.mentorName || "Faculty Mentor"}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span>{formatDate(log.date)}</span>
                          </div>
                          {details.time && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span>{details.time}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-655">
                            {details.mode || "Offline"}
                          </span>
                          <span className="mt-0.5 max-w-[150px] truncate text-xs text-slate-450">
                            {details.venue || (details.link ? "Online session" : details.mode || "Offline")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${getStatusClass(log.status)}`}>
                          {getStatusIcon(log.status)}
                          {getStatusLabel(log.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-200 hover:bg-slate-50 group-hover/row:border-slate-350 group-hover/row:text-slate-800"
                          aria-label={`View ${log.topic || "meeting"} details`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <button onClick={() => setSelectedLog(null)} className="absolute right-4 top-4 text-xl font-bold text-slate-400 hover:text-slate-600">x</button>
            
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="pr-12 text-xl font-bold leading-tight text-slate-900">{selectedLog.topic}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusClass(selectedLog.status)}`}>
                  {getStatusIcon(selectedLog.status)}
                  {getStatusLabel(selectedLog.status)}
                </span>
              </div>
              {(() => {
                const details = getMeetingDetails(selectedLog);
                return (
                  <div className="space-y-2 text-sm text-slate-500 font-medium">
                    <p>
                      Date: {selectedLog.date}
                      {details.time ? ` at ${details.time}` : ""}
                      {" "}• Mentor: {selectedLog.mentorName || "Not Specified"}
                    </p>
                    {(details.mode || details.link) && (
                      <p>
                        {details.mode ? `Mode: ${details.mode}` : ""}
                        {details.link && (
                          <>
                            {" "}•{" "}
                            <a href={details.link} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 hover:text-blue-900">
                              <span className="inline-flex items-center gap-1">
                                <LinkIcon className="h-3.5 w-3.5" />
                                Open meeting link
                              </span>
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="mb-6 rounded-lg border border-slate-100 bg-slate-50 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Agenda / Discussion Summary</h3>
                <p className="text-slate-750 whitespace-pre-wrap leading-relaxed">{getMeetingDetails(selectedLog).agenda}</p>
            </div>

            {isMentor && selectedLog.status === 'Pending' && (
              <div className="flex gap-3 mb-4">
                <button 
                  onClick={() => handleStatusUpdate("Verified")}
                  disabled={isUpdating}
                  className="flex-1 rounded-lg bg-green-600 py-3 font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {isUpdating ? "..." : "Verify Meeting"}
                </button>
                <button 
                  onClick={() => handleStatusUpdate("Rejected")}
                  disabled={isUpdating}
                  className="flex-1 rounded-lg bg-red-50 py-3 font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}

            <button 
              onClick={() => setSelectedLog(null)}
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </>
  );
}
