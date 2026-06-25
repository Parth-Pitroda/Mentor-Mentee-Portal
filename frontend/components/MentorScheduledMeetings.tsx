"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateScheduledMeetingAttendance, updateMeetingCommonPoints, updateMeetingStudentNotes } from "@/lib/actions/student.actions";
import { getFileViewUrl } from "@/lib/files";
import { Calendar, MapPin, Video, Clock, Users, Download, ExternalLink, Check, FileText, Trash2, Plus, Loader2 } from "lucide-react";

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
  const agenda = meeting.agenda || (agendaIndex >= 0 ? lines.slice(agendaIndex + 1).join("\n").trim() : description);

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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [commonPointsText, setCommonPointsText] = useState<string>("");
  const [savingCommonPoints, setSavingCommonPoints] = useState(false);
  const [commonPointsMessage, setCommonPointsMessage] = useState("");

  // Per-student notes state
  const [notesMap, setNotesMap] = useState<Record<string, StudentNote[]>>({});
  const [openNotesId, setOpenNotesId] = useState<string | null>(null);
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [notesMessage, setNotesMessage] = useState<Record<string, string>>({});

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

  const selectedGroup = groups.find((group) => group.key === selectedKey) || groups[0] || null;

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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr] select-none">
      {/* Left Column: Meeting Selection List */}
      <div className="space-y-3">
        {groups.map((group) => {
          const attendedCount = group.records.filter((record) => record.status === "Verified").length;
          const isSelected = selectedGroup?.key === group.key;
          const isOnline = group.mode?.toUpperCase() === "ONLINE";

          return (
            <button
              key={group.key}
              type="button"
              onClick={() => setSelectedKey(group.key)}
              className={`w-full rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer shadow-sm relative ${
                isSelected 
                  ? "border-blue-400 bg-blue-50/40 ring-1 ring-blue-400/20" 
                  : "border-slate-200 bg-white hover:border-slate-350 hover:shadow"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h3 className={`font-bold text-sm truncate ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
                    {group.topic}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>{group.date || "Date pending"}</span>
                  </div>
                  {group.time && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>{group.time}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Users className="w-3 h-3" />
                    {attendedCount}/{group.records.length}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    isOnline 
                      ? "bg-indigo-50 border-indigo-100 text-indigo-700" 
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}>
                    {isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {group.mode || "Offline"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Column: Group Detail Board */}
      {selectedGroup && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Section Header */}
          <div className="border-b border-slate-100 p-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{selectedGroup.topic}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedGroup.date || "N/A"}</span>
                  {selectedGroup.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedGroup.time}</span>}
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedGroup.venue || selectedGroup.mode || "Offline"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void exportMeetingReportPdf(selectedGroup)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition cursor-pointer active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Export PDF
                </button>
                {selectedGroup.link && (
                  <a
                    href={selectedGroup.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition cursor-pointer active:scale-[0.98]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Link
                  </a>
                )}
              </div>
            </div>

            <div className="border-l-4 border-slate-300 bg-slate-50/50 px-4.5 py-3 rounded-r-xl select-none">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Meeting Agenda</span>
              <p className="text-sm font-semibold leading-relaxed text-slate-650 whitespace-pre-wrap">
                {selectedGroup.agenda || "No agenda provided."}
              </p>
            </div>

            {/* Common Points Section */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Common Points Related to All Students
                </label>
              </div>
              <textarea
                value={commonPointsText}
                onChange={(e) => { setCommonPointsText(e.target.value); setCommonPointsMessage(""); }}
                rows={3}
                placeholder="Enter common discussion points, observations, or notes that apply to all students in this meeting..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-semibold placeholder:font-medium placeholder:text-slate-400 shadow-inner"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveCommonPoints()}
                  disabled={savingCommonPoints}
                  className="rounded-xl bg-blue-600 px-4.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  {savingCommonPoints ? "Saving..." : "Save Common Points"}
                </button>
                {commonPointsMessage && (
                  <span className={`text-xs font-bold ${commonPointsMessage === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                    {commonPointsMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Student Roster Lists */}
          <div className="divide-y divide-slate-100 bg-white">
            {selectedGroup.records.map((meeting) => {
              const student = meeting.student;
              const studentName = student?.fullName || meeting.studentName || "Unknown Student";
              const attended = meeting.status === "Verified";

              const currentNotes = getNotesForMeeting(meeting.$id, meeting);
              const isNotesOpen = openNotesId === meeting.$id;
              const noteCount = currentNotes.filter((n) => n.problem || n.action).length;

              return (
                <div key={meeting.$id} className="p-6 transition hover:bg-slate-50/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href={`?tab=student-profile&id=${meeting.studentId}`}
                      className="flex min-w-0 items-center gap-4 group"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 shadow-sm group-hover:border-blue-200">
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
                      <div className="min-w-0 space-y-0.5">
                        <p className="truncate font-extrabold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{studentName}</p>
                        <p className="truncate text-xs text-slate-455 font-semibold">{student?.email || "No email available"}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {student?.rollNo && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-550 uppercase tracking-wider">{student.rollNo}</span>
                          )}
                          {student?.department && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-550 uppercase tracking-wider">{student.department}</span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <button
                        type="button"
                        disabled={updatingId === meeting.$id}
                        onClick={() => void handleAttendance(meeting, !attended)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                          attended
                            ? "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100/70"
                            : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350"
                        }`}
                      >
                        {updatingId === meeting.$id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : attended ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                        )}
                        {updatingId === meeting.$id ? "Updating..." : attended ? "Met" : "Mark Met"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenNotesId(isNotesOpen ? null : meeting.$id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                          isNotesOpen
                            ? "border-amber-300 bg-amber-50 text-amber-800"
                            : noteCount > 0
                              ? "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                              : "border-slate-200 bg-white text-slate-650 hover:bg-slate-50 hover:border-slate-355"
                        }`}
                      >
                        <FileText className="w-4 h-4 shrink-0 text-slate-500" />
                        Action Dossier{noteCount > 0 ? ` (${noteCount})` : ""}
                      </button>
                    </div>
                  </div>

                  {/* Student Notes Inline Editor */}
                  {isNotesOpen && (
                    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/15 p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Student Incident Logs & Feedback</p>
                      </div>
                      
                      {currentNotes.length === 0 && (
                        <p className="text-xs font-semibold text-slate-450 italic py-1">No individual student logs entered for this meeting slot. Click "Add Problem" to record feedback.</p>
                      )}

                      <div className="space-y-4">
                        {currentNotes.map((note, noteIndex) => (
                          <div key={noteIndex} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm relative space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-extrabold text-slate-500">Record #{noteIndex + 1}</span>
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
                                <label className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block">Observed Issue / Problem Faced</label>
                                <textarea
                                  value={note.problem}
                                  onChange={(e) => handleUpdateNote(meeting.$id, noteIndex, "problem", e.target.value, meeting)}
                                  rows={2}
                                  placeholder="Describe any academic, logistical, or personal challenges..."
                                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block">Action Taken / Proposed Solution</label>
                                <textarea
                                  value={note.action}
                                  onChange={(e) => handleUpdateNote(meeting.$id, noteIndex, "action", e.target.value, meeting)}
                                  rows={2}
                                  placeholder="Describe the solution, guidance, or next steps suggested..."
                                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleAddNote(meeting.$id, meeting)}
                          className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-350 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-650 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Incident Note
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSaveNotes(meeting.$id, meeting)}
                          disabled={savingNotesId === meeting.$id}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                        >
                          {savingNotesId === meeting.$id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Save Logs
                        </button>
                        {notesMessage[meeting.$id] && (
                          <span className={`text-xs font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full ${
                            notesMessage[meeting.$id] === "Saved!" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                            {notesMessage[meeting.$id]}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
