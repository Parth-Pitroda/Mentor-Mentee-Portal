"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateScheduledMeetingAttendance, updateMeetingCommonPoints, updateMeetingStudentNotes } from "@/lib/actions/student.actions";
import { getFileViewUrl } from "@/lib/files";

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

const REPORT_LOGO_PATH = "/pdeu.png";

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

async function exportMeetingReport(group: MeetingGroup) {
  const logoDataUrl = await getReportLogoDataUrl();
  const html = buildMeetingReportHtml(group, logoDataUrl);
  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(`${group.topic}-${group.date}`)}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <h3 className="text-lg font-bold text-slate-800">No scheduled meetings yet</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">Create a meeting above and it will appear here for attendance tracking.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <div className="space-y-3">
        {groups.map((group) => {
          const attendedCount = group.records.filter((record) => record.status === "Verified").length;
          const isSelected = selectedGroup?.key === group.key;

          return (
            <button
              key={group.key}
              type="button"
              onClick={() => setSelectedKey(group.key)}
              className={`w-full rounded-lg border p-4 text-left shadow-sm transition ${
                isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-slate-900">{group.topic}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {group.date || "Date pending"} {group.time ? `at ${group.time}` : ""}
                  </p>
                </div>
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm">
                  {attendedCount}/{group.records.length}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                {group.mode || "Offline"}
              </p>
            </button>
          );
        })}
      </div>

      {selectedGroup && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedGroup.topic}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedGroup.date || "Date pending"} {selectedGroup.time ? `at ${selectedGroup.time}` : ""} / {selectedGroup.mode || "Offline"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void exportMeetingReport(selectedGroup)}
                  className="w-fit rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Export Report
                </button>
                {selectedGroup.link && (
                  <a
                    href={selectedGroup.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-fit rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                  >
                    Open Link
                  </a>
                )}
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              {selectedGroup.agenda || "No agenda provided."}
            </p>

            {/* Common Points Section */}
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Common Points Related to All Students
              </label>
              <textarea
                value={commonPointsText}
                onChange={(e) => { setCommonPointsText(e.target.value); setCommonPointsMessage(""); }}
                rows={4}
                placeholder="Enter common discussion points, observations, or notes that apply to all students in this meeting..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveCommonPoints()}
                  disabled={savingCommonPoints}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingCommonPoints ? "Saving..." : "Save Common Points"}
                </button>
                {commonPointsMessage && (
                  <span className={`text-sm font-semibold ${commonPointsMessage === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                    {commonPointsMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {selectedGroup.records.map((meeting) => {
              const student = meeting.student;
              const studentName = student?.fullName || meeting.studentName || "Unknown Student";
              const attended = meeting.status === "Verified";

              const currentNotes = getNotesForMeeting(meeting.$id, meeting);
              const isNotesOpen = openNotesId === meeting.$id;
              const noteCount = currentNotes.filter((n) => n.problem || n.action).length;

              return (
                <div key={meeting.$id} className="p-5">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                    <Link
                      href={`?tab=student-profile&id=${meeting.studentId}`}
                      className="flex min-w-0 items-center gap-4 rounded-lg p-1 transition hover:bg-slate-50"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
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
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{studentName}</p>
                        <p className="truncate text-sm text-slate-500">{student?.email || "No email available"}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {student?.department && (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{student.department}</span>
                          )}
                          {student?.rollNo && (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{student.rollNo}</span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={attended}
                          disabled={updatingId === meeting.$id}
                          onChange={(event) => handleAttendance(meeting, event.target.checked)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        {updatingId === meeting.$id ? "Updating..." : attended ? "Met" : "Mark Met"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setOpenNotesId(isNotesOpen ? null : meeting.$id)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                          isNotesOpen
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : noteCount > 0
                              ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-200"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                        </svg>
                        Action{noteCount > 0 ? ` (${noteCount})` : ""}
                      </button>
                    </div>
                  </div>

                  {/* Student Notes Inline Editor */}
                  {isNotesOpen && (
                    <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/40 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">Problems Faced & Solutions</p>
                      {currentNotes.length === 0 && (
                        <p className="mb-3 text-sm text-slate-500">No problems recorded. Click "Add Problem" to start.</p>
                      )}
                      <div className="space-y-3">
                        {currentNotes.map((note, noteIndex) => (
                          <div key={noteIndex} className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500">Problem #{noteIndex + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveNote(meeting.$id, noteIndex, meeting)}
                                className="text-xs font-bold text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                            <textarea
                              value={note.problem}
                              onChange={(e) => handleUpdateNote(meeting.$id, noteIndex, "problem", e.target.value, meeting)}
                              rows={2}
                              placeholder="Problem Faced: Describe the problem faced by the student..."
                              className="mb-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <textarea
                              value={note.action}
                              onChange={(e) => handleUpdateNote(meeting.$id, noteIndex, "action", e.target.value, meeting)}
                              rows={2}
                              placeholder="Solution / Action Taken: Describe the action taken or solution..."
                              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleAddNote(meeting.$id, meeting)}
                          className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          + Add Problem
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSaveNotes(meeting.$id, meeting)}
                          disabled={savingNotesId === meeting.$id}
                          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60"
                        >
                          {savingNotesId === meeting.$id ? "Saving..." : "Save Notes"}
                        </button>
                        {notesMessage[meeting.$id] && (
                          <span className={`text-sm font-semibold ${notesMessage[meeting.$id] === "Saved!" ? "text-green-600" : "text-red-600"}`}>
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
