"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/lib/router-compat";
import { scheduleMentorMeeting } from "@/lib/actions/student.actions";
import { getFileViewUrl } from "@/lib/files";
import { Calendar, Clock, Video, MapPin, Users, FileText, Search, Check, AlertCircle } from "lucide-react";

type SchedulerMentee = {
  $id: string;
  fullName?: string;
  email?: string;
  rollNo?: string;
  department?: string;
  semester?: string | number;
  profilePictureId?: string;
};

function getInitials(name = "Student") {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function MentorMeetingScheduler({ mentees = [] }: { mentees?: SchedulerMentee[] }) {
  const router = useRouter();
  const [mode, setMode] = useState("OFFLINE");
  const [recipientMode, setRecipientMode] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // New controlled inputs for Autofill & Suggestions
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");

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
      setTopic("");
      setDate("");
      setMessage(`Meeting scheduled for ${result.count || 0} mentee${result.count === 1 ? "" : "s"}.`);
      router.refresh();
      setIsSubmitting(false);
      return;
    }

    setMessage(result.error || "Could not schedule the meeting.");
    setIsSubmitting(false);
  };

  return (
    <div className="w-full select-none animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Message Alert */}
        {message && (
          <div className={`flex items-start gap-3 rounded-xl border p-4 text-xs font-semibold animate-in fade-in duration-200 ${
            message.startsWith("Meeting scheduled") 
              ? "bg-emerald-50 border-emerald-150 text-emerald-800" 
              : "bg-rose-50 border-rose-150 text-rose-800"
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
              message.startsWith("Meeting scheduled") ? "text-emerald-600" : "text-rose-600"
            }`} />
            <div>{message}</div>
          </div>
        )}

        {/* Two Column Form Fields Layout (Zero Negative Space) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          <input type="hidden" name="recipientMode" value={recipientMode} />
          {selectedIds.map((studentId) => (
            <input key={studentId} type="hidden" name="studentIds" value={studentId} />
          ))}

          {/* Left Column: Session Details */}
          <div className="flex flex-col gap-4.5 justify-between">
            {/* Topic */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Discussion Topic</label>
              <div className="relative flex items-center">
                <FileText className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  required
                  name="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Mid-semester academic review"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pl-10 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
              {/* Quick Topic Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-0.5 select-none">
                {[
                  "Academic Progress Review",
                  "Internship & Project Prep",
                  "Career Guidance Counseling",
                  "General Wellness Check-in"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setTopic(suggestion)}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 hover:border-slate-350 transition duration-150 cursor-pointer active:scale-[0.98]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center select-none">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Date</label>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
                      setDate(today);
                    }}
                    className="text-[9px] font-bold text-slate-450 hover:text-slate-900 transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Set to Today
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    required
                    name="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pl-10 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Time</label>
                <div className="relative flex items-center">
                  <Clock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    required
                    name="time"
                    type="time"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pl-10 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Type selector & dynamic inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Meeting Type</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-[38px] items-center">
                  {[
                    { id: "OFFLINE", label: "In-Person", icon: MapPin },
                    { id: "ONLINE", label: "Online", icon: Video }
                  ].map((option) => {
                    const Icon = option.icon;
                    const active = mode === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center justify-center gap-1.5 cursor-pointer rounded-lg py-1.5 text-[11px] font-bold transition-all duration-200 select-none ${
                          active ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-850"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mode"
                          value={option.id}
                          checked={active}
                          onChange={() => setMode(option.id)}
                          className="sr-only"
                        />
                        <Icon className="w-3 h-3" />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Venue / Link input alongside Meeting Type */}
              <div className="flex-1">
                {mode === "ONLINE" ? (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Meeting Link</label>
                    <div className="relative flex items-center">
                      <Video className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        required
                        name="link"
                        type="url"
                        placeholder="https://meet.google.com/..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pl-10 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Venue / Room</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        name="venue"
                        type="text"
                        placeholder="Faculty Cabin, classroom, etc."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 pl-10 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agenda */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Meeting Agenda</label>
              <textarea
                required
                name="agenda"
                placeholder="Outline discussion points, preparation notes, and objectives..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400 leading-relaxed flex-1 min-h-[120px]"
              />
            </div>
          </div>

          {/* Right Column: Recipients Selector */}
          <div className="flex flex-col gap-4 border-l border-slate-100 pl-0 lg:pl-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Recipients</label>
                <span className="text-[10px] font-extrabold text-slate-755 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                  {selectedCount} selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                {[
                  { id: "all", label: "All Mentees", icon: Users },
                  { id: "selected", label: "Select Mentees", icon: Check }
                ].map((option) => {
                  const Icon = option.icon;
                  const active = recipientMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRecipientMode(option.id as "all" | "selected")}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                        active ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List panel */}
            <div className="flex-1 flex flex-col justify-stretch">
              {recipientMode === "all" ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/20 p-6 flex flex-col items-center justify-center text-center flex-1 min-h-[280px]">
                  <Users className="w-8 h-8 text-slate-350 mb-2.5" />
                  <p className="text-xs font-extrabold text-slate-800">Invite All Assigned Mentees</p>
                  <p className="text-[11px] text-slate-455 mt-1 max-w-xs leading-relaxed font-semibold">
                    Every student in your mentorship roster ({mentees.length} mentee{mentees.length === 1 ? "" : "s"}) will automatically receive a scheduled session log invite.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/20 p-4 space-y-4 flex-1 flex flex-col justify-between min-h-[280px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
                    {/* Search Box */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all sm:max-w-xs flex-1 shadow-inner">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name..."
                        className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-400 w-full"
                      />
                    </div>
                    {/* Bulk Actions */}
                    <div className="flex gap-2 select-none shrink-0">
                      <button
                        type="button"
                        onClick={selectAllVisible}
                        className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-650 transition cursor-pointer shadow-sm active:scale-[0.98]"
                      >
                        Select Visible
                      </button>
                      <button
                        type="button"
                        onClick={clearSelected}
                        className="flex-1 sm:flex-initial rounded-xl border border-rose-200 bg-white hover:bg-rose-50/30 px-3 py-1 text-[11px] font-bold text-rose-600 transition cursor-pointer shadow-sm active:scale-[0.98]"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Students Grid - fills container height */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[220px] flex-1 pr-1">
                    {filteredMentees.length === 0 ? (
                      <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center select-none flex items-center justify-center">
                        <p className="text-xs font-semibold text-slate-455 italic">No mentees found.</p>
                      </div>
                    ) : (
                      filteredMentees.map((mentee) => {
                        const checked = selectedIds.includes(mentee.$id);
                        const menteeName = mentee.fullName || "Unnamed Student";
                        
                        return (
                          <label
                            key={mentee.$id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 bg-white transition-all duration-200 select-none shadow-sm hover:shadow hover:border-slate-355 ${
                              checked 
                                ? "border-slate-800 ring-2 ring-slate-100" 
                                : "border-slate-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelected(mentee.$id)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                            />
                            
                            {/* Profile Pic or Initials */}
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-700 overflow-hidden shrink-0 shadow-sm">
                              {mentee.profilePictureId ? (
                                <img
                                  src={getFileViewUrl(mentee.profilePictureId)}
                                  alt={`${menteeName} Profile`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getInitials(menteeName)
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] font-bold text-slate-800 leading-tight">{menteeName}</span>
                              <span className="block truncate text-[9px] font-semibold text-slate-400 mt-0.5">
                                {mentee.rollNo || "No Roll No"} • Sem {mentee.semester || "N/A"} ({mentee.department || "N/A"})
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Submit Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100 select-none">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:opacity-60 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>

      </form>
    </div>
  );
}
