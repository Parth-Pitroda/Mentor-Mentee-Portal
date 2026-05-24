"use client";

import { useState } from "react";
import { updateMeetingStatus } from "@/lib/actions/student.actions";

export default function MeetingTableWrapper({ initialMeetings, profileId, isMentor = false }: any) {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle Mentor Verification Actions
  const handleStatusUpdate = async (status: "Verified" | "Rejected") => {
    setIsUpdating(true);
    await updateMeetingStatus(selectedLog.$id, status, profileId);
    setIsUpdating(false);
    setSelectedLog(null);
    window.location.reload(); // Refresh to see the new badge color
  };

  const getStatusClass = (status: string) => {
    if (status === "Verified" || status === "Confirmed") {
      return "bg-green-50 text-green-700 border-green-100";
    }

    if (status === "Rejected") {
      return "bg-red-50 text-red-700 border-red-100";
    }

    if (status === "Requested") {
      return "bg-blue-50 text-blue-700 border-blue-100";
    }

    if (status === "Scheduled") {
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }

    return "bg-yellow-50 text-yellow-700 border-yellow-100";
  };

  const getMeetingDetails = (meeting: any) => {
    const description = meeting.description || "";
    const lines = description.split("\n");
    const time = meeting.scheduledTime || meeting.proposedTime || lines.find((line: string) => line.startsWith("Time:"))?.replace("Time:", "").trim() || "";
    const mode = meeting.meetingMode || lines.find((line: string) => line.startsWith("Mode:"))?.replace("Mode:", "").trim() || "";
    const link = meeting.meetingLink || lines.find((line: string) => line.startsWith("Link:"))?.replace("Link:", "").trim() || "";
    const agendaIndex = lines.findIndex((line: string) => line.trim() === "Agenda:");
    const agenda = meeting.agenda || (agendaIndex >= 0 ? lines.slice(agendaIndex + 1).join("\n").trim() : description);

    return { time, mode, link, agenda };
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-bold text-slate-900">Meetings</h3>
            <p className="mt-1 text-xs text-slate-500">Scheduled sessions, requests, and mentorship history</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Meeting Topic</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialMeetings.length > 0 ? (
                initialMeetings.map((log: any) => (
                  <tr key={log.$id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-medium text-slate-700">{log.date}</td>
                    <td className="px-6 py-4 text-slate-600">{log.topic}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusClass(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="font-semibold text-blue-700 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">No meeting logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <button onClick={() => setSelectedLog(null)} className="absolute right-4 top-4 text-xl font-bold text-slate-400 hover:text-slate-600">x</button>
            
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="pr-12 text-xl font-bold leading-tight text-slate-900">{selectedLog.topic}</h2>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusClass(selectedLog.status)}`}>
                  {selectedLog.status}
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
                              Open meeting link
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
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{getMeetingDetails(selectedLog).agenda}</p>
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
