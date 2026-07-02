"use client";

import { useState } from "react";
import { updateMeetingStatus } from "@/lib/actions/student.actions";
import { useRouter } from "@/lib/router-compat";
import type { Meeting } from "@/types";
import MeetingRequestForm from "./MeetingRequestForm";
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  ExternalLink, 
  X,
  Plus
} from "lucide-react";

type MeetingLog = Meeting & {
  $id: string;
  topic: string;
  status: string;
  mentorName?: string;
  proposedTime?: string;
};

type StudentNote = {
  problem?: string;
  action?: string;
};

type MeetingTableWrapperProps = {
  initialMeetings: MeetingLog[];
  profileId: string;
  isMentor?: boolean;
};

function parseStudentNotes(meeting: MeetingLog): StudentNote[] {
  // Try dedicated attribute first
  const raw = (meeting as any).studentNotes || "";
  if (raw) {
    try { 
      const parsed = JSON.parse(raw); 
      if (Array.isArray(parsed)) return parsed; 
    } catch { 
      /* fall through */ 
    }
  }
  // Try description fallback
  const desc = meeting.description || "";
  const marker = "\n---STUDENT_NOTES---\n";
  if (desc.includes(marker)) {
    let slice = desc.slice(desc.indexOf(marker) + marker.length);
    // Trim off any following markers
    const cpMarker = "\n---COMMON_POINTS---\n";
    if (slice.includes(cpMarker)) slice = slice.slice(0, slice.indexOf(cpMarker));
    try { 
      const parsed = JSON.parse(slice.trim()); 
      if (Array.isArray(parsed)) return parsed; 
    } catch { 
      /* ignore */ 
    }
  }
  return [];
}

export default function MeetingTableWrapper({ initialMeetings, profileId, isMentor = false }: MeetingTableWrapperProps) {
  const router = useRouter();
  const [selectedLog, setSelectedLog] = useState<MeetingLog | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get today's local date string formatted as YYYY-MM-DD
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Group and sort meetings
  const upcomingMeetings = initialMeetings.filter(
    (m) => (m.status === "Confirmed" || m.status === "Scheduled") && (m.date && m.date >= todayStr)
  );
  const pendingMeetings = initialMeetings.filter(
    (m) => m.status === "Requested" || m.status === "Pending"
  );
  const historyMeetings = initialMeetings.filter(
    (m) => 
      m.status === "Verified" || 
      m.status === "Rejected" ||
      ((m.status === "Confirmed" || m.status === "Scheduled") && (m.date && m.date < todayStr))
  );

  const getInitialTab = () => {
    if (upcomingMeetings.length > 0) return "upcoming";
    if (pendingMeetings.length > 0) return "pending";
    return "history";
  };

  const [activeTab, setActiveTab] = useState<"upcoming" | "pending" | "history">(getInitialTab());

  // Filter displayed meetings based on active tab
  const displayedMeetings = activeTab === "upcoming" 
    ? upcomingMeetings 
    : activeTab === "pending" 
      ? pendingMeetings 
      : historyMeetings;

  // Handle Mentor Verification Actions
  const handleStatusUpdate = async (status: "Verified" | "Rejected") => {
    if (!selectedLog) return;
    setIsUpdating(true);
    await updateMeetingStatus(selectedLog.$id, status, profileId);
    setIsUpdating(false);
    setSelectedLog(null);
    router.refresh();
  };

  const getStatusClass = (status: string) => {
    if (status === "Verified" || status === "Confirmed") {
      return "bg-green-50 text-green-700 border-green-150";
    }

    if (status === "Rejected") {
      return "bg-red-50 text-red-700 border-red-150";
    }

    if (status === "Requested" || status === "Pending") {
      return "bg-blue-50 text-blue-700 border-blue-150";
    }

    if (status === "Scheduled") {
      return "bg-indigo-50 text-indigo-700 border-indigo-150";
    }

    return "bg-yellow-50 text-yellow-700 border-yellow-150";
  };

  const getMeetingDetails = (meeting: MeetingLog) => {
    const description = meeting.description || "";
    const lines = description.split("\n");
    const time = meeting.scheduledTime || meeting.proposedTime || lines.find((line: string) => line.startsWith("Time:"))?.replace("Time:", "").trim() || "";
    const mode = meeting.meetingMode || lines.find((line: string) => line.startsWith("Mode:"))?.replace("Mode:", "").trim() || "";
    const link = meeting.meetingLink || lines.find((line: string) => line.startsWith("Link:"))?.replace("Link:", "").trim() || "";
    const venue = lines.find((line: string) => line.startsWith("Venue:"))?.replace("Venue:", "").trim() || link || mode || "Not specified";
    const agendaIndex = lines.findIndex((line: string) => line.trim() === "Agenda:");
    
    let agenda = meeting.agenda || (agendaIndex >= 0 ? lines.slice(agendaIndex + 1).join("\n").trim() : description);

    // Clean agenda by removing markers
    const cpMarker = "---COMMON_POINTS---";
    const snMarker = "---STUDENT_NOTES---";
    if (agenda.includes(cpMarker)) {
      agenda = agenda.split(cpMarker)[0].trim();
    }
    if (agenda.includes(snMarker)) {
      agenda = agenda.split(snMarker)[0].trim();
    }

    // If the agenda still starts with the scheduled meeting marker and meta info, clean it up
    if (agenda.includes("[Mentor Scheduled Meeting]")) {
      const cleanLines = agenda.split("\n").filter(line => {
        const trimmed = line.trim();
        return (
          trimmed !== "[Mentor Scheduled Meeting]" &&
          !trimmed.startsWith("Time:") &&
          !trimmed.startsWith("Mode:") &&
          !trimmed.startsWith("Venue:") &&
          !trimmed.startsWith("Link:") &&
          trimmed !== "Agenda:"
        );
      });
      agenda = cleanLines.join("\n").trim();
    }

    return { time, mode, link, venue, agenda };
  };

  return (
    <>
      {/* Full-width clean Table section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
        
        {/* Table Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Session History</h3>
          </div>
          
          <button
            onClick={() => setIsRequestOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4.5 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer select-none active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Request Meeting</span>
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex gap-8 border-b border-slate-100 px-6 pt-4 bg-slate-50/25 select-none">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer relative ${
              activeTab === "upcoming"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <span>Upcoming Sessions</span>
            {upcomingMeetings.length > 0 && (
              <span className="ml-2 bg-slate-100 text-slate-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-slate-250">
                {upcomingMeetings.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer relative ${
              activeTab === "pending"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <span>Requested / Pending</span>
            {pendingMeetings.length > 0 && (
              <span className="ml-2 bg-blue-50 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-blue-200">
                {pendingMeetings.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer relative ${
              activeTab === "history"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <span>Past History</span>
            {historyMeetings.length > 0 && (
              <span className="ml-2 bg-slate-50 text-slate-655 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-slate-200">
                {historyMeetings.length}
              </span>
            )}
          </button>
        </div>

        {/* Meetings List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-extrabold">Meeting Topic</th>
                <th className="px-6 py-4 font-extrabold">Date & Time</th>
                <th className="px-6 py-4 font-extrabold">Mode / Venue</th>
                <th className="px-6 py-4 font-extrabold">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedMeetings.length > 0 ? (
                displayedMeetings.map((log) => {
                  const details = getMeetingDetails(log);
                  const isOnline = details.mode?.toUpperCase() === "ONLINE";
                  return (
                    <tr 
                      key={log.$id} 
                      onClick={() => setSelectedLog(log)}
                      className="group/row transition-colors hover:bg-slate-50/50 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 group-hover/row:text-blue-700 transition-colors leading-tight">{log.topic}</p>
                        {details.agenda && (
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-md font-semibold">{details.agenda}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-655 font-bold">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{log.date}</span>
                          </div>
                          {details.time && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{details.time}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                          isOnline
                            ? "bg-indigo-50 border-indigo-150 text-indigo-700"
                            : "bg-slate-50 border-slate-200 text-slate-655"
                        }`}>
                          {details.mode || "Offline"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getStatusClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 group-hover/row:text-slate-850 group-hover/row:border-slate-350 hover:bg-slate-50 transition-all duration-200 shadow-sm ml-auto">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-bold">
                    No meetings found in this tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over details drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full sm:w-[450px] h-full bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-350 ease-out border-l border-slate-200">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 select-none">
              <div className="min-w-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider mb-2 ${getStatusClass(selectedLog.status)}`}>
                  {selectedLog.status}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 leading-snug truncate max-w-[280px]" title={selectedLog.topic}>
                  {selectedLog.topic}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedLog(null)} 
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(() => {
                const details = getMeetingDetails(selectedLog);
                const isOnline = details.mode?.toUpperCase() === "ONLINE";
                return (
                  <>
                    {/* Session Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-655 bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">Scheduled Date</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedLog.date}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">Time</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{details.time || "Not Specified"}</span>
                        </div>
                      </div>
                      <div className="space-y-1 col-span-2 border-t border-slate-150 pt-3">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">Faculty Mentor</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-extrabold">
                            {selectedLog.mentorName?.charAt(0).toUpperCase() || "M"}
                          </div>
                          <span>{selectedLog.mentorName || "Not Assigned"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Location & Link */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block select-none font-extrabold">Location / Venue</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                          isOnline
                            ? "bg-indigo-50 border-indigo-150 text-indigo-700"
                            : "bg-slate-50 border-slate-200 text-slate-655"
                        }`}>
                          {details.mode || "Offline"}
                        </span>
                        <span className="text-xs text-slate-555 font-bold truncate max-w-[200px]">
                          {details.venue || details.mode || "In-Person"}
                        </span>
                      </div>
                      
                      {isOnline && details.link && (
                        <div className="pt-2 select-none">
                          <a 
                            href={details.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer active:scale-[0.99]"
                          >
                            <span>Join Online Meeting</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Agenda */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block select-none font-extrabold">Meeting Agenda</span>
                      <div className="rounded-xl border border-slate-150 bg-slate-50/20 p-4">
                        <p className="text-xs font-semibold leading-relaxed text-slate-600 whitespace-pre-wrap">
                          {details.agenda || "No agenda provided."}
                        </p>
                      </div>
                    </div>

                    {/* Mentor Notes / Guidance Logs */}
                    {(() => {
                      const notes = parseStudentNotes(selectedLog);
                      if (notes.length === 0) return null;
                      return (
                        <div className="space-y-3 border-t border-slate-100 pt-6 animate-in fade-in">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block select-none font-extrabold">Discussion Log & Guidance</span>
                          <div className="space-y-3.5">
                            {notes.map((note, index) => (
                              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                                {note.problem && (
                                  <div>
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">Discussed Issue</span>
                                    <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed">{note.problem}</p>
                                  </div>
                                )}
                                {note.action && (
                                  <div className={note.problem ? "border-t border-slate-150 pt-2.5" : ""}>
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none font-extrabold">Suggested Guidance / Action</span>
                                    <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed">{note.action}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Mentor Verification Action controls (only for isMentor === true) */}
                    {isMentor && selectedLog.status === 'Pending' && (
                      <div className="flex gap-3 border-t border-slate-100 pt-6">
                        <button 
                          onClick={() => handleStatusUpdate("Verified")}
                          disabled={isUpdating}
                          className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white text-xs transition-colors hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                        >
                          {isUpdating ? "..." : "Verify Meeting"}
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate("Rejected")}
                          disabled={isUpdating}
                          className="flex-1 rounded-xl bg-red-50 py-3 font-bold text-red-700 text-xs transition-colors hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-100 p-6 bg-slate-50/50 shrink-0">
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm text-xs cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Slide-over Request Session drawer */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsRequestOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full sm:w-[450px] h-full bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-350 ease-out border-l border-slate-200">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 select-none">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                  Request a Session
                </h2>
                <p className="mt-1 text-xs text-slate-500 font-semibold">Propose a new mentorship meeting to your mentor</p>
              </div>
              <button 
                onClick={() => setIsRequestOpen(false)} 
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <MeetingRequestForm 
                profileId={profileId} 
                openByDefault={true} 
                onSuccess={() => setIsRequestOpen(false)}
              />
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-100 p-6 bg-slate-50/50 shrink-0">
              <button 
                onClick={() => setIsRequestOpen(false)}
                className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
