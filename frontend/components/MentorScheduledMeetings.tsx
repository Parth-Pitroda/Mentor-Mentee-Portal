"use client";

import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "@/lib/router-compat";
import { updateScheduledMeetingAttendance, updateMeetingCommonPoints, updateMeetingStudentNotes } from "@/lib/actions/student.actions";
import { getFileViewUrl } from "@/lib/files";
import { Calendar, MapPin, Video, Clock, Users, Download, ExternalLink, Check, FileText, Trash2, Plus, Loader2, Search, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";

type StudentNote = { problem: string; action: string };

type ScheduledMeeting = {
  $id: string;
  studentId: string;
  studentName?: string;
  mentorName?: string;
  date?: string;
  topic?: string;
  description?: string;
  status?: string;
  scheduledTime?: string;
  meetingMode?: string;
  meetingLink?: string;
  agenda?: string;
  commonPoints?: string;
  studentNotes?: string;
  student?: {
    $id: string;
    fullName?: string;
    email?: string;
    department?: string;
    rollNo?: string;
    semester?: string;
    profilePictureId?: string;
  } | null;
};

type MeetingGroup = {
  key: string;
  topic: string;
  date: string;
  time: string;
  mode: string;
  link: string;
  venue: string;
  agenda: string;
  commonPoints: string;
  records: ScheduledMeeting[];
};

const REPORT_LOGO_PATH = "/pdeu_logo.png";

function parseMeetingDetails(meeting: ScheduledMeeting) {
  const description = meeting.description || "";
  const lines = description.split("\n");
  const time = meeting.scheduledTime || lines.find((line) => line.startsWith("Time:"))?.replace("Time:", "").trim() || "";
  const mode = meeting.meetingMode || lines.find((line) => line.startsWith("Mode:"))?.replace("Mode:", "").trim() || "Offline";
  const link = meeting.meetingLink || lines.find((line) => line.startsWith("Link:"))?.replace("Link:", "").trim() || "";
  const venue = lines.find((line) => line.startsWith("Venue:"))?.replace("Venue:", "").trim() || link || mode || "Not specified";
  const agendaIndex = lines.findIndex((line) => line.trim() === "Agenda:");
  
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
}

function getInitials(name = "Student") {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function escapeHtml(value?: string | number) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateForReport(date?: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function safeFileName(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "meeting-report";
}

function parseStudentNotes(meeting: ScheduledMeeting): StudentNote[] {
  // Try dedicated attribute first
  const raw = (meeting as any).studentNotes || "";
  if (raw) {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch { /* fall through */ }
  }
  // Try description fallback
  const desc = meeting.description || "";
  const marker = "\n---STUDENT_NOTES---\n";
  if (desc.includes(marker)) {
    let slice = desc.slice(desc.indexOf(marker) + marker.length);
    // Trim off any following markers
    const cpMarker = "\n---COMMON_POINTS---\n";
    if (slice.includes(cpMarker)) slice = slice.slice(0, slice.indexOf(cpMarker));
    try { const parsed = JSON.parse(slice.trim()); if (Array.isArray(parsed)) return parsed; } catch { /* ignore */ }
  }
  return [];
}

function problemRows(records: ScheduledMeeting[]) {
  const rows: { studentId: string; studentName: string; rollNo: string; problem: string; action: string }[] = [];
  for (const meeting of records) {
    const student = meeting.student;
    const name = student?.fullName || meeting.studentName || "Unknown Student";
    const roll = student?.rollNo || meeting.studentId;
    const notes = parseStudentNotes(meeting);
    for (const note of notes) {
      if (note.problem || note.action) {
        rows.push({ studentId: meeting.studentId, studentName: name, rollNo: roll, problem: note.problem, action: note.action });
      }
    }
  }
  if (rows.length === 0) {
    return `<tr><td>1</td><td>&nbsp;</td><td>&nbsp;</td><td>No specific problem recorded.</td><td>&nbsp;</td></tr>`;
  }
  return rows.map((row, i) =>
    `<tr><td>${i + 1}</td><td>${escapeHtml(row.rollNo)}</td><td>${escapeHtml(row.studentName)}</td><td>${escapeHtml(row.problem)}</td><td>${escapeHtml(row.action)}</td></tr>`
  ).join("");
}

function rosterRows(records: ScheduledMeeting[]) {
  const sortedRecords = [...records].sort((a, b) => {
    const aStudent = a.student;
    const bStudent = b.student;
    return String(aStudent?.rollNo || a.studentName || aStudent?.fullName || "").localeCompare(
      String(bStudent?.rollNo || b.studentName || bStudent?.fullName || "")
    );
  });

  const pairs: ScheduledMeeting[][] = [];
  for (let index = 0; index < sortedRecords.length; index += 2) {
    pairs.push(sortedRecords.slice(index, index + 2));
  }

  return pairs.map((pair) => {
    const cells = pair.flatMap((meeting) => {
      const student = meeting.student;
      const studentName = student?.fullName || meeting.studentName || "Unknown Student";
      const studentId = student?.rollNo || meeting.studentId;
      const attendance = meeting.status === "Verified" ? "Present" : "Absent";

      return [
        `<td>${escapeHtml(studentId)}</td>`,
        `<td>${escapeHtml(studentName)}</td>`,
        `<td>${attendance}</td>`,
      ];
    });

    while (cells.length < 6) {
      cells.push("<td>&nbsp;</td>");
    }

    return `<tr>${cells.join("")}</tr>`;
  }).join("");
}

async function getReportLogoDataUrl() {
  try {
    const response = await fetch(REPORT_LOGO_PATH);
    if (!response.ok) return "";

    const blob = await response.blob();

    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function buildMeetingReportHtml(group: MeetingGroup, logoDataUrl: string) {
  const mentorName = group.records.find((record) => record.mentorName)?.mentorName || "Faculty Mentor";
  const presentCount = group.records.filter((record) => record.status === "Verified").length;
  const absentCount = group.records.length - presentCount;
  const commonPoints = group.commonPoints || [group.topic, group.agenda].filter(Boolean).join("\n\n");
  const logoHtml = logoDataUrl
    ? `<img class="logo" src="${logoDataUrl}" alt="Pandit Deendayal Energy University logo" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 0.65in; }
    body { font-family: Arial, sans-serif; color: #111827; font-size: 11pt; }
    h1, h2, h3, p { margin: 0; }
    .report-header { border: none; margin-bottom: 18px; }
    .report-header td { border: none; padding: 0; vertical-align: top; }
    .logo-cell { width: 92px; }
    .logo { width: 76px; height: auto; display: block; }
    .header { text-align: center; line-height: 1.35; padding-right: 92px; }
    .department { font-size: 13pt; font-weight: 700; }
    .school { font-size: 12pt; font-weight: 700; }
    .university { font-size: 12pt; font-weight: 700; }
    .title { margin-top: 14px; font-size: 14pt; font-weight: 700; text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    td, th { border: 1px solid #111827; padding: 6px 7px; vertical-align: top; }
    th { font-weight: 700; text-align: center; }
    .meta td { width: 25%; }
    .section-title { margin-top: 18px; font-weight: 700; }
    .box { min-height: 64px; white-space: pre-wrap; }
    .summary { margin-top: 10px; font-weight: 700; }
  </style>
</head>
<body>
  <table class="report-header">
    <tr>
      <td class="logo-cell">${logoHtml}</td>
      <td>
        <div class="header">
          <p class="department">Department of Computer Science and Engineering</p>
          <p class="school">School of Technology</p>
          <p class="university">Pandit Deendayal Energy University</p>
          <p class="title">Mentor-Mentee Meeting</p>
        </div>
      </td>
    </tr>
  </table>

  <table class="meta">
    <tr>
      <td><strong>Name of Mentor:</strong></td>
      <td>${escapeHtml(mentorName)}</td>
      <td><strong>Date:</strong></td>
      <td>${escapeHtml(formatDateForReport(group.date))}</td>
    </tr>
    <tr>
      <td><strong>Venue:</strong></td>
      <td>${escapeHtml(group.venue)}</td>
      <td><strong>Time:</strong></td>
      <td>${escapeHtml(group.time)}</td>
    </tr>
  </table>

  <table>
    <thead>
      <tr>
        <th>ID No</th>
        <th>Name of Student</th>
        <th>Present/Absent</th>
        <th>ID No</th>
        <th>Name of Student</th>
        <th>Present/Absent</th>
      </tr>
    </thead>
    <tbody>
      ${rosterRows(group.records)}
    </tbody>
  </table>
  <p class="summary">Present: ${presentCount} &nbsp;&nbsp; Absent: ${absentCount} &nbsp;&nbsp; Total: ${group.records.length}</p>

  <p class="section-title">Common Points Related to all students</p>
  <table><tr><td class="box">${escapeHtml(commonPoints || "No common points recorded.")}</td></tr></table>

  <p class="section-title">Action Taken/Suggestions</p>
  <table><tr><td class="box">Attendance recorded. Follow-up actions/suggestions can be added by the mentor.</td></tr></table>

  <p class="section-title">Any Specific/Personal/Psychological problems faced by Students.</p>
  <table>
    <thead>
      <tr>
        <th>Sr No</th>
        <th>ID No</th>
        <th>Student Name</th>
        <th>Problem Faced</th>
        <th>Solution</th>
      </tr>
    </thead>
    <tbody>
      ${problemRows(group.records)}
    </tbody>
  </table>
</body>
</html>`;
}

async function exportMeetingReportDocx(group: MeetingGroup) {
  const logoDataUrl = await getReportLogoDataUrl();
  const html = buildMeetingReportHtml(group, logoDataUrl);
  const filename = safeFileName(`${group.topic}-${group.date}`);

  try {
    const response = await fetch("/api/export-docx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html, filename }),
    });

    if (!response.ok) {
      throw new Error("Failed to export Word document");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export DOCX:", error);
    alert("Could not export Word document. Please try again.");
  }
}

async function exportMeetingReportPdf(group: MeetingGroup) {
  const logoDataUrl = await getReportLogoDataUrl();
  const html = buildMeetingReportHtml(group, logoDataUrl);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    const style = doc.createElement("style");
    style.innerHTML = `
      @media print {
        body { margin: 1.6cm 1.2cm; }
        .no-print { display: none !important; }
      }
    `;
    doc.head.appendChild(style);

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  }
}

export default function MentorScheduledMeetings({ meetings }: { meetings: ScheduledMeeting[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [commonPointsText, setCommonPointsText] = useState<string>("");
  const [savingCommonPoints, setSavingCommonPoints] = useState(false);
  const [commonPointsMessage, setCommonPointsMessage] = useState("");

  // Per-student notes state
  const [notesMap, setNotesMap] = useState<Record<string, StudentNote[]>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [notesMessage, setNotesMessage] = useState<Record<string, string>>({});

  // Slide-over drawer and roster filter states
  const [activeNotesMeetingId, setActiveNotesMeetingId] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "met" | "not-met" | "logs">("all");
  
  // Read Meetings Hub search query directly from q query parameter
  const meetingSearchQuery = searchParams.get("q") || "";

  const groups = useMemo<MeetingGroup[]>(() => {
    const groupMap = new Map<string, MeetingGroup>();

    meetings.forEach((meeting) => {
      const details = parseMeetingDetails(meeting);
      const key = [
        meeting.date || "",
        meeting.topic || "Scheduled Meeting",
        details.time,
        details.mode,
        details.link,
        details.venue,
        details.agenda,
      ].join("||");

      if (!groupMap.has(key)) {
        // Extract saved commonPoints from the meeting record
        const descMarker = "\n---COMMON_POINTS---\n";
        const desc = meeting.description || "";
        let savedFromDesc = desc.includes(descMarker) ? desc.slice(desc.indexOf(descMarker) + descMarker.length).trim() : "";
        const snMarker = "\n---STUDENT_NOTES---\n";
        if (savedFromDesc.includes(snMarker)) {
          savedFromDesc = savedFromDesc.slice(0, savedFromDesc.indexOf(snMarker)).trim();
        }
        const savedCommonPoints = (meeting as any).commonPoints || savedFromDesc || "";

        groupMap.set(key, {
          key,
          topic: meeting.topic || "Scheduled Meeting",
          date: meeting.date || "",
          time: details.time,
          mode: details.mode,
          link: details.link,
          venue: details.venue,
          agenda: details.agenda,
          commonPoints: savedCommonPoints,
          records: [],
        });
      }
      groupMap.get(key)?.records.push(meeting);
    });

    return Array.from(groupMap.values()).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [meetings]);

  const urlGroupId = searchParams.get("meetingGroupId");
  const selectedGroup = groups.find((group) => group.key === urlGroupId) || null;

  // Sync commonPointsText when selected group changes
  const selectedGroupKey = selectedGroup?.key ?? null;
  const prevKeyRef = useMemo(() => ({ current: "" }), []);
  if (selectedGroupKey !== prevKeyRef.current) {
    prevKeyRef.current = selectedGroupKey ?? "";
    if (selectedGroup && commonPointsText !== selectedGroup.commonPoints) {
      setCommonPointsText(selectedGroup.commonPoints);
      setCommonPointsMessage("");
    }
  }

  async function handleSaveCommonPoints() {
    if (!selectedGroup) return;
    setSavingCommonPoints(true);
    setCommonPointsMessage("");
    const ids = selectedGroup.records.map((r) => r.$id);
    const result = await updateMeetingCommonPoints(ids, commonPointsText);
    setSavingCommonPoints(false);
    if (result && (result as any).success) {
      setCommonPointsMessage("Saved!");
      router.refresh();
    } else {
      setCommonPointsMessage((result as any)?.error || "Failed to save.");
    }
  }

  async function handleAttendance(meeting: ScheduledMeeting, attended: boolean) {
    setUpdatingId(meeting.$id);
    await updateScheduledMeetingAttendance(meeting.$id, meeting.studentId, attended);
    setUpdatingId(null);
    router.refresh();
  }

  // --- Student notes helpers ---
  function getNotesForMeeting(meetingId: string, meeting: ScheduledMeeting): StudentNote[] {
    if (notesMap[meetingId] !== undefined) return notesMap[meetingId];
    return parseStudentNotes(meeting);
  }

  function setNotes(meetingId: string, notes: StudentNote[]) {
    setNotesMap((prev) => ({ ...prev, [meetingId]: notes }));
  }

  function handleAddNote(meetingId: string, meeting: ScheduledMeeting) {
    const current = getNotesForMeeting(meetingId, meeting);
    setNotes(meetingId, [...current, { problem: "", action: "" }]);
  }

  function handleUpdateNote(meetingId: string, index: number, field: "problem" | "action", value: string, meeting: ScheduledMeeting) {
    const current = [...getNotesForMeeting(meetingId, meeting)];
    current[index] = { ...current[index], [field]: value };
    setNotes(meetingId, current);
  }

  function handleRemoveNote(meetingId: string, index: number, meeting: ScheduledMeeting) {
    const current = [...getNotesForMeeting(meetingId, meeting)];
    current.splice(index, 1);
    setNotes(meetingId, current);
  }

  async function handleSaveNotes(meetingId: string, meeting: ScheduledMeeting) {
    const notes = getNotesForMeeting(meetingId, meeting).filter((n) => n.problem || n.action);
    setSavingNotesId(meetingId);
    setNotesMessage((prev) => ({ ...prev, [meetingId]: "" }));
    const result = await updateMeetingStudentNotes(meetingId, JSON.stringify(notes));
    setSavingNotesId(null);
    if (result && (result as any).success) {
      setNotesMessage((prev) => ({ ...prev, [meetingId]: "Saved!" }));
      setNotes(meetingId, notes);
      router.refresh();
    } else {
      setNotesMessage((prev) => ({ ...prev, [meetingId]: (result as any)?.error || "Failed to save." }));
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center select-none shadow-sm max-w-xl mx-auto my-8 animate-in fade-in duration-300">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-800">No scheduled meetings yet</h3>
        <p className="mt-1 text-xs font-semibold text-slate-400 max-w-md mx-auto leading-relaxed">
          Create a meeting above and it will appear here for attendance tracking and feedback logging.
        </p>
      </div>
    );
  }

  // --- Filter Groups for the Hub ---
  const filteredGroups = useMemo<MeetingGroup[]>(() => {
    const q = meetingSearchQuery.toLowerCase().trim();
    if (!q) return groups;
    return groups.filter(g => 
      (g.topic || "").toLowerCase().includes(q) || 
      (g.date || "").toLowerCase().includes(q)
    );
  }, [groups, meetingSearchQuery]);

  // Master Detail conditional rendering
  if (!selectedGroup) {
    // LAYOUT A: Meetings List Hub (Master view) - Table format
    return (
      <div className="space-y-6 select-none animate-in fade-in duration-300">
        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center select-none shadow-sm max-w-xl mx-auto my-8 animate-in fade-in duration-300">
            <Search className="w-10 h-10 text-slate-350 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-850">No matching meetings found</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Try resetting search filter or checking spelling.</p>
          </div>
        ) : (
          <div className="overflow-x-auto select-none bg-white border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-4 px-6 font-extrabold">Meeting Topic</th>
                  <th className="py-4 px-6 font-extrabold">Date & Time</th>
                  <th className="py-4 px-6 font-extrabold">Venue / Mode</th>
                  <th className="py-4 px-6 font-extrabold">Attendance</th>
                  <th className="py-4 px-6 font-extrabold text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.map((group: MeetingGroup) => {
                  const attendedCount = group.records.filter((record: ScheduledMeeting) => record.status === "Verified").length;
                  const totalRecords = group.records.length;
                  const attendancePercent = totalRecords > 0 ? Math.round((attendedCount / totalRecords) * 100) : 0;
                  const isOnline = group.mode?.toUpperCase() === "ONLINE";

                  return (
                    <tr
                      key={group.key}
                      onClick={() => router.push(`${pathname}?tab=meetings&meetingGroupId=${group.key}`)}
                      className="group/row hover:bg-slate-50/50 transition-colors text-sm text-slate-655 cursor-pointer animate-in fade-in duration-200"
                    >
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 leading-tight hover:text-blue-700 transition-colors">
                          {group.topic}
                        </p>
                        {group.records[0]?.agenda && (
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-xs md:max-w-md">
                            {group.records[0].agenda}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{group.date || "Pending Date"}</span>
                          </div>
                          {group.time && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{group.time}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                            isOnline
                              ? "bg-indigo-50 border-indigo-150 text-indigo-700"
                              : "bg-slate-50 border-slate-200 text-slate-655"
                          }`}>
                            {group.mode || "Offline"}
                          </span>
                          <span className="text-xs text-slate-450 truncate max-w-[150px] mt-0.5">
                            {group.venue || group.mode || "Offline"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 w-28">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span>{attendedCount} / {totalRecords}</span>
                            <span>{attendancePercent}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${attendancePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 group-hover/row:text-slate-800 group-hover/row:border-slate-350 hover:bg-slate-50 transition-all duration-200 shadow-sm ml-auto">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // LAYOUT B: Dedicated Meeting Detail View (Detail view)
  const filteredRecords = selectedGroup.records.filter((meeting) => {
    const student = meeting.student;
    const studentName = (student?.fullName || meeting.studentName || "Unknown Student").toLowerCase();
    const rollNo = (student?.rollNo || meeting.studentId || "").toLowerCase();
    const searchLower = studentQuery.toLowerCase().trim();
    
    const matchesSearch = studentName.includes(searchLower) || rollNo.includes(searchLower);
    if (!matchesSearch) return false;
    
    const attended = meeting.status === "Verified";
    const currentNotes = getNotesForMeeting(meeting.$id, meeting);
    const noteCount = currentNotes.filter((n) => n.problem || n.action).length;
    
    if (rosterFilter === "met") return attended;
    if (rosterFilter === "not-met") return !attended;
    if (rosterFilter === "logs") return noteCount > 0;
    return true;
  });

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Main Stacking Master Detail Layout */}
      <div className="space-y-8">
        
        {/* Left Column: Meeting Metadata Info & Common Points */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedGroup.topic}</h2>
                <p className="text-xs text-slate-450 mt-0.5">Scheduled Mentorship Session Details</p>
              </div>
              <button
                type="button"
                onClick={() => void exportMeetingReportPdf(selectedGroup)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition cursor-pointer active:scale-[0.98] shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Report</span>
              </button>
            </div>

            {/* Clean Horizontal Metadata Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Date</span>
                <p className="font-bold text-slate-850">{selectedGroup.date || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Time</span>
                <p className="font-bold text-slate-855">{selectedGroup.time || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Venue / Mode</span>
                <span className="font-bold text-slate-850 truncate block">{selectedGroup.venue || selectedGroup.mode || "Offline"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Meeting Link</span>
                {selectedGroup.link ? (
                  <a 
                    href={selectedGroup.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-650 hover:text-blue-850 hover:underline font-bold truncate block flex items-center gap-1"
                  >
                    <span>Join Session</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="font-semibold text-slate-400">In-Person</p>
                )}
              </div>
            </div>

            {/* Agenda & Discussion Points Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Agenda Card */}
              <div className="rounded-xl border border-slate-150 bg-slate-50/30 p-5 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Meeting Agenda</span>
                <p className="text-xs font-semibold leading-relaxed text-slate-655 whitespace-pre-wrap">
                  {selectedGroup.agenda || "No agenda provided."}
                </p>
              </div>

              {/* Common Points Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 font-extrabold">Common Discussion Points</span>
                  {commonPointsMessage && (
                    <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider">
                      {commonPointsMessage}
                    </span>
                  )}
                </div>
                <textarea
                  value={commonPointsText}
                  onChange={(e) => { setCommonPointsText(e.target.value); setCommonPointsMessage(""); }}
                  rows={3}
                  placeholder="Enter comments for all students..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 outline-none transition focus:border-blue-500 font-semibold placeholder:font-medium placeholder:text-slate-400 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => void handleSaveCommonPoints()}
                  disabled={savingCommonPoints}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  {savingCommonPoints ? "Saving..." : "Save Points"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Student Roster List & Attendance Tracker */}
        <div className="space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Attendance & Logs</h3>
                <p className="text-xs text-slate-450 mt-0.5">Manage student attendance status and log entries</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Roster Quick Filters (Segmented Pill Style) */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 select-none">
                  {[
                    { id: "all", label: "All", count: selectedGroup.records.length },
                    { id: "met", label: "Present", count: selectedGroup.records.filter(r => r.status === "Verified").length },
                    { id: "not-met", label: "Absent", count: selectedGroup.records.filter(r => r.status !== "Verified").length },
                    { id: "logs", label: "Logs", count: selectedGroup.records.filter(r => getNotesForMeeting(r.$id, r).filter(n => n.problem || n.action).length > 0).length }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRosterFilter(tab.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                        rosterFilter === tab.id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* Roster Search Input */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all sm:w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="search"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search name..."
                    className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-400 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="overflow-x-auto select-none">
            {filteredRecords.length === 0 ? (
              <div className="p-16 text-center text-slate-550 select-none">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">No students match current filter</p>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Try changing filters or searching another name.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    <th className="py-3 px-4 font-extrabold">Student Info</th>
                    <th className="py-3 px-4 font-extrabold">Course / Sem</th>
                    <th className="py-3 px-4 font-extrabold">Attendance</th>
                    <th className="py-3 px-4 font-extrabold text-right">Action Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((meeting) => {
                    const student = meeting.student;
                    const studentName = student?.fullName || meeting.studentName || "Unknown Student";
                    const attended = meeting.status === "Verified";
                    const currentNotes = getNotesForMeeting(meeting.$id, meeting);
                    const noteCount = currentNotes.filter((n) => n.problem || n.action).length;

                    return (
                      <tr 
                        key={meeting.$id} 
                        className="hover:bg-slate-50/50 transition-colors text-sm text-slate-655"
                      >
                        <td className="py-3 px-4">
                          <Link
                            to={`?tab=student-profile&id=${meeting.studentId}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-755 overflow-hidden shrink-0 shadow-sm group-hover:border-blue-200">
                              {student?.profilePictureId ? (
                                <img
                                  src={getFileViewUrl(student.profilePictureId)}
                                  alt={`${studentName} Profile`}
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                              ) : (
                                getInitials(studentName)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors truncate max-w-[180px]">{studentName}</p>
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px] font-semibold">
                                {student?.rollNo || "N/A"} • {student?.email || "No email"}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 truncate max-w-[160px]">{student?.department || "N/A"}</p>
                          <p className="text-xs text-slate-455 mt-0.5">Sem {student?.semester || "N/A"}</p>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            disabled={updatingId === meeting.$id}
                            onClick={() => void handleAttendance(meeting, !attended)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                              attended
                                ? "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100/50"
                                : "bg-white border-slate-200 text-slate-655 hover:bg-slate-50 hover:border-slate-355"
                            }`}
                          >
                            {updatingId === meeting.$id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : attended ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                            <span>{updatingId === meeting.$id ? "Updating..." : attended ? "Present" : "Mark Present"}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveNotesMeetingId(meeting.$id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer select-none ${
                              noteCount > 0
                                ? "border-amber-250 bg-amber-50/50 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                                : "border-slate-200 bg-white text-slate-655 hover:bg-slate-50 hover:border-slate-355"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0 text-slate-505" />
                            <span>Logs{noteCount > 0 ? ` (${noteCount})` : ""}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Slide-Over Drawer for Action Dossier */}
      {activeNotesMeetingId && (() => {
        const meeting = selectedGroup.records.find((m) => m.$id === activeNotesMeetingId);
        if (!meeting) return null;
        const student = meeting.student;
        const studentName = student?.fullName || meeting.studentName || "Unknown Student";
        const currentNotes = getNotesForMeeting(meeting.$id, meeting);
        
        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
              onClick={() => setActiveNotesMeetingId(null)}
            />
            
            {/* Drawer panel */}
            <div className="relative w-full sm:w-[500px] h-full bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-350 ease-out border-l border-slate-200">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-150 px-6 py-4.5 bg-slate-50/50 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-150 bg-white shadow-sm font-bold text-slate-700">
                    {student?.profilePictureId ? (
                      <img
                        src={getFileViewUrl(student.profilePictureId)}
                        alt={`${studentName} Profile`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(studentName)
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-none">{studentName}</h3>
                    <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider mt-1">Action Dossier & Logs</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNotesMeetingId(null)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
              
              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center gap-2 select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Student Incident Logs & Feedback</p>
                </div>
                
                {currentNotes.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center select-none animate-in fade-in">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-455 italic">No logs entered for this student in this session.</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Click the button below to add your first incident log.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {currentNotes.map((note, noteIndex) => (
                    <div key={noteIndex} className="rounded-xl border border-slate-200 bg-slate-50/20 p-4 shadow-sm relative space-y-3.5 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-slate-150 pb-2 select-none">
                        <span className="text-xs font-extrabold text-slate-550">Record #{noteIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(meeting.$id, noteIndex, meeting)}
                          className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-455 uppercase tracking-wider block select-none">Observed Issue / Problem Faced</label>
                          <textarea
                            value={note.problem}
                            onChange={(e) => handleUpdateNote(meeting.$id, noteIndex, "problem", e.target.value, meeting)}
                            rows={2}
                            placeholder="Describe academic, logistical, or personal challenges..."
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-455 uppercase tracking-wider block select-none">Action Taken / Proposed Solution</label>
                          <textarea
                            value={note.action}
                            onChange={(e) => handleUpdateNote(meeting.$id, noteIndex, "action", e.target.value, meeting)}
                            rows={2}
                            placeholder="Describe the solution, guidance, or next steps suggested..."
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Drawer Footer (Pinned) */}
              <div className="border-t border-slate-150 p-6 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => handleAddNote(meeting.$id, meeting)}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-350 bg-white hover:bg-slate-50 px-4.5 py-2.5 text-xs font-bold text-slate-655 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Note
                </button>
                
                <div className="flex items-center gap-3">
                  {notesMessage[meeting.$id] && (
                    <span className={`text-[10px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full ${
                      notesMessage[meeting.$id] === "Saved!" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {notesMessage[meeting.$id]}
                    </span>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => void handleSaveNotes(meeting.$id, meeting)}
                    disabled={savingNotesId === meeting.$id}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:opacity-60 px-5 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
                  >
                    {savingNotesId === meeting.$id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Save Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
