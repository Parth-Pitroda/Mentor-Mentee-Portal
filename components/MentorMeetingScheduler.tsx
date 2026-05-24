"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleMentorMeeting } from "@/lib/actions/student.actions";

type SchedulerMentee = {
  $id: string;
  fullName?: string;
  email?: string;
  rollNo?: string;
  department?: string;
  semester?: string | number;
};

export default function MentorMeetingScheduler({ mentees = [] }: { mentees?: SchedulerMentee[] }) {
  const router = useRouter();
  const [mode, setMode] = useState("OFFLINE");
  const [recipientMode, setRecipientMode] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const filteredMentees = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return mentees;

    return mentees.filter((mentee) =>
      [
        mentee.fullName,
        mentee.email,
        mentee.rollNo,
        mentee.department,
        mentee.semester,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [mentees, search]);

  const selectedCount = recipientMode === "all" ? mentees.length : selectedIds.length;

  const toggleSelected = (studentId: string) => {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredMentees.map((mentee) => mentee.$id);
    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
  };

  const clearSelected = () => setSelectedIds([]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const form = event.currentTarget;
    const result = await scheduleMentorMeeting(new FormData(form));

    if (result.success) {
      form.reset();
      setMode("OFFLINE");
      setRecipientMode("all");
      setSelectedIds([]);
      setSearch("");
      setMessage(`Meeting scheduled for ${result.count || 0} mentee${result.count === 1 ? "" : "s"}.`);
      router.refresh();
      setIsSubmitting(false);
      return;
    }

    setMessage(result.error || "Could not schedule the meeting.");
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Schedule Roster Meeting</h2>
        <p className="mt-1 text-sm text-slate-500">Create one meeting for every mentee currently assigned to you.</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-3 py-2 text-sm font-semibold ${
          message.startsWith("Meeting scheduled") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="recipientMode" value={recipientMode} />
        {selectedIds.map((studentId) => (
          <input key={studentId} type="hidden" name="studentIds" value={studentId} />
        ))}

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Topic</label>
          <input
            required
            name="topic"
            type="text"
            placeholder="Academic review, internship planning..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
          <input
            required
            name="date"
            type="date"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Time</label>
          <input
            required
            name="time"
            type="time"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Meeting Type</label>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1">
            {["OFFLINE", "ONLINE"].map((option) => (
              <label
                key={option}
                className={`cursor-pointer rounded-lg px-4 py-2.5 text-center text-sm font-bold transition ${
                  mode === option ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={option}
                  checked={mode === option}
                  onChange={() => setMode(option)}
                  className="sr-only"
                />
                {option === "ONLINE" ? "Online" : "Offline"}
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Recipients</label>
            <span className="text-xs font-bold text-slate-500">
              {selectedCount} selected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1">
            {[
              { value: "all", label: "All mentees" },
              { value: "selected", label: "Selected mentees" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRecipientMode(option.value as "all" | "selected")}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  recipientMode === option.value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {recipientMode === "selected" && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search mentees by name, roll no, or email"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    Select visible
                  </button>
                  <button
                    type="button"
                    onClick={clearSelected}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {filteredMentees.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-500">
                    No mentees match your search.
                  </p>
                ) : (
                  filteredMentees.map((mentee) => {
                    const checked = selectedIds.includes(mentee.$id);

                    return (
                      <label
                        key={mentee.$id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition ${
                          checked ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelected(mentee.$id)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                          {(mentee.fullName || "S").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-800">{mentee.fullName || "Unnamed Student"}</span>
                          <span className="block truncate text-xs font-medium text-slate-500">
                            {mentee.rollNo || "No roll no"}{mentee.email ? ` / ${mentee.email}` : ""}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {mode === "ONLINE" && (
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Meeting Link</label>
            <input
              required
              name="link"
              type="url"
              placeholder="https://meet.google.com/..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}

        {mode === "OFFLINE" && (
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Venue / Room</label>
            <input
              name="venue"
              type="text"
              placeholder="Faculty cabin, lab, classroom..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Agenda</label>
          <textarea
            required
            name="agenda"
            rows={4}
            placeholder="Add the discussion agenda and preparation notes..."
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
        </button>
      </div>
    </form>
  );
}
