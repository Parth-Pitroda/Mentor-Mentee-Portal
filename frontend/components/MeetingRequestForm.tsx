"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestMeeting } from "@/lib/actions/student.actions";

export default function MeetingRequestForm({ profileId, openByDefault = false, onSuccess }: { profileId: string; openByDefault?: boolean; onSuccess?: () => void }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(openByDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const result = await requestMeeting(profileId, new FormData(form));

    if (result.success) {
      form.reset();
      setIsOpen(openByDefault);
      router.refresh();
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      return;
    }

    setError(result.error || "Could not submit the meeting request.");
    setIsSubmitting(false);
  };

  return (
    <div className={openByDefault ? "" : "mt-5 border-t border-slate-200 pt-5"}>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Request Meeting
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input
                required
                name="proposedDate"
                type="date"
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
              <input
                required
                name="proposedTime"
                type="time"
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agenda</label>
            <textarea
              required
              name="agenda"
              rows={3}
              className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="What would you like to discuss?"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Send Request"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(openByDefault);
                setError("");
              }}
              className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
