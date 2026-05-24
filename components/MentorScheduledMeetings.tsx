"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateScheduledMeetingAttendance } from "@/lib/actions/student.actions";

type ScheduledMeeting = {
  $id: string;
  studentId: string;
  studentName?: string;
  date?: string;
  topic?: string;
  description?: string;
  status?: string;
  scheduledTime?: string;
  meetingMode?: string;
  meetingLink?: string;
  agenda?: string;
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
  agenda: string;
  records: ScheduledMeeting[];
};

function parseMeetingDetails(meeting: ScheduledMeeting) {
  const description = meeting.description || "";
  const lines = description.split("\n");
  const time = meeting.scheduledTime || lines.find((line) => line.startsWith("Time:"))?.replace("Time:", "").trim() || "";
  const mode = meeting.meetingMode || lines.find((line) => line.startsWith("Mode:"))?.replace("Mode:", "").trim() || "Offline";
  const link = meeting.meetingLink || lines.find((line) => line.startsWith("Link:"))?.replace("Link:", "").trim() || "";
  const agendaIndex = lines.findIndex((line) => line.trim() === "Agenda:");
  const agenda = meeting.agenda || (agendaIndex >= 0 ? lines.slice(agendaIndex + 1).join("\n").trim() : description);

  return { time, mode, link, agenda };
}

function getInitials(name = "Student") {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function MentorScheduledMeetings({ meetings }: { meetings: ScheduledMeeting[] }) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
        details.agenda,
      ].join("||");

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          topic: meeting.topic || "Scheduled Meeting",
          date: meeting.date || "",
          time: details.time,
          mode: details.mode,
          link: details.link,
          agenda: details.agenda,
          records: [],
        });
      }

      groupMap.get(key)?.records.push(meeting);
    });

    return Array.from(groupMap.values()).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [meetings]);

  const selectedGroup = groups.find((group) => group.key === selectedKey) || groups[0] || null;

  async function handleAttendance(meeting: ScheduledMeeting, attended: boolean) {
    setUpdatingId(meeting.$id);
    await updateScheduledMeetingAttendance(meeting.$id, meeting.studentId, attended);
    setUpdatingId(null);
    router.refresh();
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
            <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              {selectedGroup.agenda || "No agenda provided."}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {selectedGroup.records.map((meeting) => {
              const student = meeting.student;
              const studentName = student?.fullName || meeting.studentName || "Unknown Student";
              const attended = meeting.status === "Verified";

              return (
                <div key={meeting.$id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <Link
                    href={`?tab=student-profile&id=${meeting.studentId}`}
                    className="flex min-w-0 items-center gap-4 rounded-lg p-1 transition hover:bg-slate-50"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
                      {student?.profilePictureId ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${student.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
